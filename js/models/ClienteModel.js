import { pedir } from "../api.js";

export class ClienteModel {
  constructor() { this.clientes = {}; }

  async cargar() { this.clientes = await pedir("clientes.php"); }

  // Busca en los clientes ya guardados
  async consultar(numero) {
    const nombre = this.clientes[numero];
    if (!nombre) throw new Error("Cliente nuevo, se guardará al emitir");
    return { nombre };
  }

  // Guarda el cliente para la próxima vez
  async guardar(numero, nombre) {
    if (![8, 11].includes(numero.length) || !nombre) return;
    this.clientes[numero] = nombre;
    await pedir("clientes.php", "POST", { documento: numero, nombre });
  }
}