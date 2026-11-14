// CAPA DE SERVICIO - Productos
// Responsabilidad: hablar con api/productos.php. No sabe nada de pantallas ni de Vue.
import { pedir } from "../api.js";

export const productoService = {
  async listar() {
    const datos = await pedir("productos.php");
    return datos.map(p => ({
      id: Number(p.id),
      nombre: p.nombre,
      precio: Number(p.precio),
      imagen: p.imagen
    }));
  },

  crear(nombre, precio, imagen) {
    return pedir("productos.php", "POST", { nombre, precio, imagen });
  },

  // Si no se envía imagen nueva, el servidor conserva la actual
  editar(id, { nombre, precio, imagen }) {
    return pedir("productos.php", "PUT", { id, nombre, precio, imagen });
  },

  quitar(id) {
    return pedir(`productos.php?id=${id}`, "DELETE");
  }
};
