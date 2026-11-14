// CAPA DE SERVICIO - Clientes
// Responsabilidad: hablar con api/clientes.php.
import { pedir } from "../api.js";

export const clienteService = {
  // Devuelve un objeto { documento: nombre }
  listar() {
    return pedir("clientes.php");
  },

  // Guarda el cliente para la próxima vez
  guardar(documento, nombre) {
    if (![8, 11].includes(documento.length) || !nombre) return Promise.resolve();
    return pedir("clientes.php", "POST", { documento, nombre });
  }
};
