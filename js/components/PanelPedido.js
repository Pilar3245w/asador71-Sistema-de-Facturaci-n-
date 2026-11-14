// COMPONENTE - Panel "Pedido"
// Responsabilidad: mostrar los platos elegidos, permitir cambiar cantidades, pedir los
// datos del cliente, validarlos y emitir el comprobante. Los datos del pedido vienen del store.
import { ref, watch } from "vue";
import { items, totales, cambiarCantidad, buscarCliente, emitirVenta, irAHoy } from "../store.js";
import { validarCliente } from "../validaciones.js";
import { soles, ETIQUETA_IGV } from "../utils.js";

export default {
  name: "PanelPedido",
  emits: ["emitida"],
  setup(props, { emit }) {
    const mesa = ref(1);
    const tipo = ref("Boleta");
    const documento = ref("");
    const cliente = ref("");
    const estadoDoc = ref("");
    const generando = ref(false);

    // Solo números; al completar un DNI (8) o RUC (11) busca el nombre del cliente
    watch(documento, valor => {
      const limpio = valor.replace(/\D/g, "");
      if (limpio !== valor) { documento.value = limpio; return; }
      if (limpio.length !== 8 && limpio.length !== 11) { estadoDoc.value = ""; return; }
      const nombre = buscarCliente(limpio);
      if (nombre) {
        cliente.value = nombre;
        estadoDoc.value = "✓ Encontrado";
      } else {
        estadoDoc.value = "Cliente nuevo, se guardará al emitir";
      }
    });

    async function generar() {
      if (!items.value.length) return alert("El pedido está vacío.");
      const datos = {
        mesa: mesa.value,
        tipo: tipo.value,
        cliente: cliente.value.trim(),
        documento: documento.value.trim()
      };
      const error = validarCliente(datos, totales.value.total);
      if (error) return alert(error);

      generando.value = true;
      try {
        const venta = await emitirVenta(datos);
        documento.value = "";
        cliente.value = "";
        estadoDoc.value = "";
        irAHoy();
        emit("emitida", venta);
      } catch (e) {
        alert("No se pudo emitir el comprobante: " + e.message);
      } finally {
        generando.value = false;
      }
    }

    return { items, totales, cambiarCantidad, soles, ETIQUETA_IGV, mesa, tipo, documento, cliente, estadoDoc, generando, generar };
  },
  template: `
    <section class="col-lg-4">
      <div class="card">
        <div class="card-body">
          <h2 class="h5 mb-3">Pedido</h2>

          <ul id="lista-pedido" class="list-group list-group-flush mb-3">
            <li v-for="i in items" :key="i.id" class="list-group-item d-flex align-items-center gap-2 px-0">
              <div class="flex-grow-1">
                {{ i.nombre }}
                <small class="d-block text-secondary">{{ soles(i.precio) }} c/u</small>
              </div>
              <div class="d-flex align-items-center gap-2">
                <button class="btn btn-llama btn-sm rounded-circle cant-btn" @click="cambiarCantidad(i.id, -1)">−</button>
                <b>{{ i.cantidad }}</b>
                <button class="btn btn-llama btn-sm rounded-circle cant-btn" @click="cambiarCantidad(i.id, 1)">+</button>
              </div>
              <span class="sub">{{ soles(i.precio * i.cantidad) }}</span>
            </li>
            <li v-if="!items.length" class="list-group-item px-0 text-secondary">Agrega platos desde la carta.</li>
          </ul>

          <div class="row g-2">
            <div class="col-6">
              <label class="form-label small text-secondary" for="mesa">Mesa</label>
              <input id="mesa" class="form-control" type="number" min="1" v-model.number="mesa">
            </div>
            <div class="col-6">
              <label class="form-label small text-secondary" for="tipo">Comprobante</label>
              <select id="tipo" class="form-select" v-model="tipo">
                <option>Boleta</option>
                <option>Factura</option>
              </select>
            </div>
            <div class="col-12">
              <input id="documento" class="form-control" v-model="documento"
                     placeholder="DNI (8 dígitos) o RUC (11 dígitos)" inputmode="numeric" maxlength="11">
              <small class="form-text">{{ estadoDoc }}</small>
            </div>
            <div class="col-12">
              <input id="cliente" class="form-control" v-model="cliente" placeholder="Nombre o razón social">
            </div>
          </div>

          <div class="mt-3">
            <div class="d-flex justify-content-between text-secondary">
              <span>Subtotal</span><span class="text-body">{{ soles(totales.subtotal) }}</span>
            </div>
            <div class="d-flex justify-content-between text-secondary">
              <span>{{ ETIQUETA_IGV }}</span><span class="text-body">{{ soles(totales.igv) }}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-1">
              <strong>Total</strong><span class="total">{{ soles(totales.total) }}</span>
            </div>
          </div>

          <button class="btn btn-llama btn-lg w-100 mt-3" :disabled="generando" @click="generar">Generar comprobante</button>
        </div>
      </div>
    </section>
  `
};
