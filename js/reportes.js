// REPORTES: funciones puras que convierten una lista de ventas en un resumen o en un CSV.

// Resumen numérico: las ventas anuladas no suman
export function calcularInforme(ventas) {
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
export function ventasACsv(ventas) {
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
