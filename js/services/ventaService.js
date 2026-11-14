// CAPA DE SERVICIO - Ventas
// Responsabilidad: hablar con api/ventas.php (emitir, listar y anular).
// El servidor valida, calcula el IGV y asigna el número de comprobante.
import { pedir } from "../api.js";

export const ventaService = {
  listar() {
    return pedir("ventas.php");
  },

  emitir({ mesa, tipo, cliente, documento, items }) {
    return pedir("ventas.php", "POST", {
      mesa, tipo, cliente, documento,
      items: items.map(i => ({ id: i.id, cantidad: i.cantidad }))
    });
  },

  anular(numero, motivo) {
    return pedir("ventas.php", "PUT", { numero, motivo });
  }
};
