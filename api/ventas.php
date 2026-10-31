<?php
require 'conexion.php';

switch ($_SERVER['REQUEST_METHOD']) {

  // Todas las ventas, con sus platos
  case 'GET':
    $ventas = $db->query('SELECT * FROM ventas ORDER BY id')->fetchAll();

    $porVenta = [];
    $detalle = $db->query('SELECT venta_id, producto_id, nombre, precio, cantidad FROM venta_detalle ORDER BY id');
    foreach ($detalle as $f) {
      $porVenta[$f['venta_id']][] = [
        'id' => (int)$f['producto_id'],
        'nombre' => $f['nombre'],
        'precio' => (float)$f['precio'],
        'cantidad' => (int)$f['cantidad'],
      ];
    }

    foreach ($ventas as &$v) {
      $v['mesa'] = (int)$v['mesa'];
      foreach (['subtotal', 'igv', 'total'] as $c) $v[$c] = (float)$v[$c];
      $v['fecha'] = str_replace(' ', 'T', $v['fecha']);
      $v['anulada'] = (bool)$v['anulada'];
      $v['fechaAnulacion'] = $v['fecha_anulacion'] ? str_replace(' ', 'T', $v['fecha_anulacion']) : null;
      unset($v['fecha_anulacion']);
      $v['items'] = $porVenta[$v['id']] ?? [];
      unset($v['id']);
    }
    unset($v);
    responder($ventas);

  // Emitir una venta: los precios, el IGV y el correlativo los calcula el servidor
  case 'POST':
    $d = leerJson();
    $tipo = ($d['tipo'] ?? '') === 'Factura' ? 'Factura' : 'Boleta';
    $pedido = $d['items'] ?? [];
    $documento = preg_replace('/\D/', '', $d['documento'] ?? '');
    $cliente = trim($d['cliente'] ?? '');
    if (!$pedido) responder(['error' => 'El pedido está vacío'], 400);

    $db->beginTransaction();
    try {
      // Precios reales desde la base de datos (no se confía en el navegador)
      $buscar = $db->prepare('SELECT id, nombre, precio FROM productos WHERE id = ?');
      $items = [];
      $total = 0;
      foreach ($pedido as $it) {
        $buscar->execute([(int)($it['id'] ?? 0)]);
        $p = $buscar->fetch();
        $cantidad = (int)($it['cantidad'] ?? 0);
        if (!$p || $cantidad < 1) {
          $db->rollBack();
          responder(['error' => 'Plato o cantidad no válidos'], 400);
        }
        $items[] = ['id' => (int)$p['id'], 'nombre' => $p['nombre'], 'precio' => (float)$p['precio'], 'cantidad' => $cantidad];
        $total += $p['precio'] * $cantidad;
      }

      $total = round($total, 2);
      $subtotal = round($total / (1 + TASA_IGV), 2);
      $igv = round($total - $subtotal, 2);

      // Reglas de SUNAT también en el servidor
      if ($tipo === 'Factura' && (strlen($documento) !== 11 || $cliente === '')) {
        $db->rollBack();
        responder(['error' => 'La factura requiere RUC de 11 dígitos y razón social'], 400);
      }
      if ($tipo === 'Boleta' && $total > 700 && (strlen($documento) !== 8 || $cliente === '')) {
        $db->rollBack();
        responder(['error' => 'Las boletas mayores a S/ 700 requieren DNI y nombre del cliente'], 400);
      }

      // Correlativo: se cuentan también las anuladas, el número nunca se reutiliza
      $cuenta = $db->prepare('SELECT COUNT(*) FROM ventas WHERE tipo = ? FOR UPDATE');
      $cuenta->execute([$tipo]);
      $numero = ($tipo === 'Factura' ? 'F001' : 'B001') . '-' . str_pad($cuenta->fetchColumn() + 1, 6, '0', STR_PAD_LEFT);

      $fecha = date('Y-m-d H:i:s');
      $cliente = $cliente !== '' ? $cliente : 'Clientes varios';
      $documento = $documento !== '' ? $documento : '-';
      $mesa = (int)($d['mesa'] ?? 0);

      $db->prepare('INSERT INTO ventas (numero, fecha, mesa, tipo, cliente, documento, subtotal, igv, total)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
         ->execute([$numero, $fecha, $mesa, $tipo, $cliente, $documento, $subtotal, $igv, $total]);
      $ventaId = $db->lastInsertId();

      $det = $db->prepare('INSERT INTO venta_detalle (venta_id, producto_id, nombre, precio, cantidad) VALUES (?, ?, ?, ?, ?)');
      foreach ($items as $i) {
        $det->execute([$ventaId, $i['id'], $i['nombre'], $i['precio'], $i['cantidad']]);
      }

      $db->commit();
    } catch (Throwable $e) {
      if ($db->inTransaction()) $db->rollBack();
      throw $e;
    }

    responder([
      'numero' => $numero, 'fecha' => str_replace(' ', 'T', $fecha), 'mesa' => $mesa,
      'tipo' => $tipo, 'cliente' => $cliente, 'documento' => $documento, 'items' => $items,
      'subtotal' => $subtotal, 'igv' => $igv, 'total' => $total,
      'anulada' => false, 'motivo' => null, 'fechaAnulacion' => null,
    ], 201);

  // Anular una venta (no se borra)
  case 'PUT':
    $d = leerJson();
    $motivo = trim($d['motivo'] ?? '');
    if ($motivo === '') responder(['error' => 'Falta el motivo de la anulación'], 400);
    $st = $db->prepare('UPDATE ventas SET anulada = 1, motivo = ?, fecha_anulacion = ? WHERE numero = ? AND anulada = 0');
    $st->execute([$motivo, date('Y-m-d H:i:s'), $d['numero'] ?? '']);
    responder(['ok' => $st->rowCount() > 0]);
}

responder(['error' => 'Método no permitido'], 405);