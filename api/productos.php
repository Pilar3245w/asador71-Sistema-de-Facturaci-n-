<?php
require 'conexion.php';

switch ($_SERVER['REQUEST_METHOD']) {

  case 'GET':
    responder($db->query('SELECT id, nombre, precio, imagen FROM productos WHERE activo = 1 ORDER BY id')->fetchAll());

  case 'POST':
    $d = leerJson();
    $nombre = trim($d['nombre'] ?? '');
    $precio = $d['precio'] ?? null;
    if ($nombre === '' || !is_numeric($precio) || $precio < 0) {
      responder(['error' => 'Datos del plato incompletos'], 400);
    }
    $st = $db->prepare('INSERT INTO productos (nombre, precio, imagen) VALUES (?, ?, ?)');
    $st->execute([$nombre, $precio, $d['imagen'] ?? null]);
    responder(['id' => (int)$db->lastInsertId()], 201);

  case 'PUT':
    $d = leerJson();
    $id = (int)($d['id'] ?? 0);
    $nombre = trim($d['nombre'] ?? '');
    $precio = $d['precio'] ?? null;
    if (!$id || $nombre === '' || !is_numeric($precio) || $precio < 0) {
      responder(['error' => 'Datos del plato incompletos'], 400);
    }
    if (!empty($d['imagen'])) {
      $st = $db->prepare('UPDATE productos SET nombre = ?, precio = ?, imagen = ? WHERE id = ?');
      $st->execute([$nombre, $precio, $d['imagen'], $id]);
    } else {
      $st = $db->prepare('UPDATE productos SET nombre = ?, precio = ? WHERE id = ?');
      $st->execute([$nombre, $precio, $id]);
    }
    responder(['ok' => true]);

  case 'DELETE':
    // Borrado lógico: el plato deja de mostrarse, pero las ventas antiguas lo conservan
    $st = $db->prepare('UPDATE productos SET activo = 0 WHERE id = ?');
    $st->execute([(int)($_GET['id'] ?? 0)]);
    responder(['ok' => true]);
}

responder(['error' => 'Método no permitido'], 405);