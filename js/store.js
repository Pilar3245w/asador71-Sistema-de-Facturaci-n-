// ESTADO COMPARTIDO de la aplicación.
// Responsabilidad: guardar los datos que usan varios componentes (platos, clientes y
// pedido actual) y las acciones que los cambian. Para hablar con el servidor usa los
// servicios; no dibuja nada en pantalla.
import { ref, computed } from "vue";
import { productoService } from "./services/productoService.js";
import { clienteService } from "./services/clienteService.js";
import { calcularTotales } from "./utils.js";

export const productos = ref([]);   // carta de platos
export const clientes = ref({});    // { documento: nombre }
export const items = ref([]);       // pedido actual

export const totales = computed(() => calcularTotales(items.value));

// Carga los datos desde MySQL una sola vez al abrir la página
export async function cargarDatos() {
  const [lista, mapaClientes] = await Promise.all([
    productoService.listar(),
    clienteService.listar()
  ]);
  productos.value = lista;
  clientes.value = mapaClientes;
}

export async function guardarPlato({ id, nombre, precio, imagen }) {
  if (id) await productoService.editar(id, { nombre, precio, imagen });
  else await productoService.crear(nombre, precio, imagen);
  productos.value = await productoService.listar();
}

export async function quitarPlato(id) {
  await productoService.quitar(id);
  items.value = items.value.filter(i => i.id !== id); // si estaba en el pedido, también sale
  productos.value = await productoService.listar();
}

export function agregarAlPedido(plato) {
  const existe = items.value.find(i => i.id === plato.id);
  if (existe) existe.cantidad++;
  else items.value.push({ id: plato.id, nombre: plato.nombre, precio: plato.precio, cantidad: 1 });
}

export function cambiarCantidad(id, delta) {
  const item = items.value.find(i => i.id === id);
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) items.value = items.value.filter(i => i.id !== id);
}

export function buscarCliente(documento) {
  return clientes.value[documento] || null;
}
