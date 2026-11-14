// ESTADO COMPARTIDO de la aplicación.
// Responsabilidad: guardar los datos que usan varios componentes (platos, clientes,
// pedido actual y ventas) y las acciones que los cambian. Para hablar con el servidor
// usa los servicios; no dibuja nada en pantalla.
import { ref, computed } from "vue";
import { productoService } from "./services/productoService.js";
import { clienteService } from "./services/clienteService.js";
import { ventaService } from "./services/ventaService.js";
import { calcularTotales, fechaLocal, hoy } from "./utils.js";
import { calcularInforme } from "./reportes.js";

export const productos = ref([]);   // carta de platos
export const clientes = ref({});    // { documento: nombre }
export const items = ref([]);       // pedido actual
export const ventas = ref([]);      // todas las ventas
export const desde = ref(hoy());    // filtro de fechas del historial
export const hasta = ref(hoy());

export const totales = computed(() => calcularTotales(items.value));

// Ventas dentro del rango de fechas, las más recientes primero
export const ventasFiltradas = computed(() =>
  ventas.value
    .filter(v => {
      const f = fechaLocal(v.fecha);
      return (!desde.value || f >= desde.value) && (!hasta.value || f <= hasta.value);
    })
    .reverse()
);

export const resumen = computed(() => calcularInforme(ventasFiltradas.value));

// Carga los datos desde MySQL una sola vez al abrir la página
export async function cargarDatos() {
  const [listaPlatos, mapaClientes, listaVentas] = await Promise.all([
    productoService.listar(),
    clienteService.listar(),
    ventaService.listar()
  ]);
  productos.value = listaPlatos;
  clientes.value = mapaClientes;
  ventas.value = listaVentas;
}

// ---------- Carta ----------
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

// ---------- Pedido ----------
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

// ---------- Ventas ----------
// El servidor valida, calcula el IGV y asigna el número de comprobante
export async function emitirVenta({ mesa, tipo, cliente, documento }) {
  if (!items.value.length) return null;

  // Guarda el cliente para la próxima vez
  await clienteService.guardar(documento, cliente);
  if ([8, 11].includes(documento.length) && cliente) {
    clientes.value = { ...clientes.value, [documento]: cliente };
  }

  const venta = await ventaService.emitir({ mesa, tipo, cliente, documento, items: items.value });
  ventas.value.push(venta);
  items.value = [];
  return venta;
}

export async function anularVenta(numero, motivo) {
  await ventaService.anular(numero, motivo);
  ventas.value = await ventaService.listar();
}

export function irAHoy() {
  desde.value = hoy();
  hasta.value = hoy();
}
