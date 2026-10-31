import { pedir } from "../api.js";

export class ProductoModel {
  constructor() { this.productos = []; }

  // Trae los platos de MySQL (se llama al iniciar y después de cada cambio)
  async cargar() {
    const datos = await pedir("productos.php");
    this.productos = datos.map(p => ({
      id: Number(p.id),
      nombre: p.nombre,
      precio: Number(p.precio),
      imagen: p.imagen
    }));
  }

  async agregar(nombre, precio, imagen) {
    await pedir("productos.php", "POST", { nombre, precio, imagen });
    await this.cargar();
  }

  // Si no se envía imagen nueva, el servidor conserva la actual
  async editar(id, { nombre, precio, imagen }) {
    await pedir("productos.php", "PUT", { id, nombre, precio, imagen });
    await this.cargar();
  }

  async eliminar(id) {
    await pedir(`productos.php?id=${id}`, "DELETE");
    await this.cargar();
  }

  obtenerTodos() { return this.productos; }
  buscar(id) { return this.productos.find(p => p.id === id); }
}