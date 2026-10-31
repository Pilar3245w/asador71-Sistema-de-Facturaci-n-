import { pedir } from "../api.js";

// Debe coincidir con TASA_IGV de api/conexion.php
// 8% IGV + 2.5% IPM (MYPE restaurantes 2026)
export const TASA_IGV = 0.105;

// Vista previa del pedido en pantalla (el cálculo oficial lo hace el servidor)
export function calcularTotales(items) {
  const total = Math.round(items.reduce((s, i) => s + i.precio * i.cantidad, 0) * 100) / 100;
  const subtotal = Math.round((total / (1 + TASA_IGV)) * 100) / 100;
  const igv = Math.round((total - subtotal) * 100) / 100;
  return { subtotal, igv, total };
}

// Convierte una fecha a texto AAAA-MM-DD (hora local), para comparar con los filtros
export function fechaLocal(fecha) {
  const d = new Date(fecha);
  const dos = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

export class PedidoModel {
  constructor() {
    this.items = [];
    this.ventas = [];
  }

  async cargarVentas() { this.ventas = await pedir("ventas.php"); }

  agregarItem(p) {
    const existe = this.items.find(i => i.id === p.id);
    if (existe) existe.cantidad++;
    else this.items.push({ id: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1 });
  }

  cambiarCantidad(id, delta) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    item.cantidad += delta;
    if (item.cantidad <= 0) this.items = this.items.filter(i => i.id !== id);
  }

  totales() { return calcularTotales(this.items); }

  // El servidor valida, calcula el IGV y asigna el número de comprobante
  async finalizar({ mesa, tipo, cliente, documento }) {
    if (this.items.length === 0) return null;
    const venta = await pedir("ventas.php", "POST", {
      mesa, tipo, cliente, documento,
      items: this.items.map(i => ({ id: i.id, cantidad: i.cantidad }))
    });
    this.ventas.push(venta);
    this.items = [];
    return venta;
  }

  async anular(numero, motivo) {
    await pedir("ventas.php", "PUT", { numero, motivo });
    await this.cargarVentas();
  }

  hoy() { return fechaLocal(new Date()); }

  buscarVenta(numero) { return this.ventas.find(v => v.numero === numero); }

  // Ventas entre dos fechas (AAAA-MM-DD), las más recientes primero
  ventasEntre(desde, hasta) {
    return this.ventas
      .filter(v => {
        const f = fechaLocal(v.fecha);
        return (!desde || f >= desde) && (!hasta || f <= hasta);
      })
      .reverse();
  }

  // Resumen numérico: las ventas anuladas no suman
  informe(ventas) {
    const validas = ventas.filter(v => !v.anulada);
    const r = {
      cantidad: validas.length,
      anuladas: ventas.length - validas.length,
      total: 0, subtotal: 0, igv: 0,
      boletas: { n: 0, total: 0 },
      facturas: { n: 0, total: 0 },
      platos: [], promedio: 0
    };
    const porPlato = {};

    validas.forEach(v => {
      r.total += v.total;
      r.subtotal += v.subtotal;
      r.igv += v.igv;
      const grupo = v.tipo === "Factura" ? r.facturas : r.boletas;
      grupo.n++;
      grupo.total += v.total;

      v.items.forEach(i => {
        porPlato[i.nombre] = porPlato[i.nombre] || { nombre: i.nombre, cantidad: 0, monto: 0 };
        porPlato[i.nombre].cantidad += i.cantidad;
        porPlato[i.nombre].monto += i.precio * i.cantidad;
      });
    });

    r.platos = Object.values(porPlato).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
    r.promedio = r.cantidad ? r.total / r.cantidad : 0;
    return r;
  }

  // Texto CSV para abrir en Excel (separador ; y orden cronológico)
  aCsv(ventas) {
    const c = t => `"${String(t).replace(/"/g, '""')}"`;
    const filas = [["N°", "Fecha", "Hora", "Tipo", "Mesa", "Documento", "Cliente", "Subtotal", "IGV", "Total", "Estado"]];
    ventas.slice().reverse().forEach(v => {
      const f = new Date(v.fecha);
      filas.push([
        v.numero, f.toLocaleDateString("es-PE"), f.toLocaleTimeString("es-PE"),
        v.tipo, v.mesa, v.documento, v.cliente,
        v.subtotal.toFixed(2), v.igv.toFixed(2), v.total.toFixed(2),
        v.anulada ? "ANULADA" : "Emitida"
      ]);
    });
    return "sep=;\r\n" + filas.map(f => f.map(c).join(";")).join("\r\n");
  }
}