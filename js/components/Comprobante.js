// COMPONENTE - Ventana del comprobante (boleta o factura)
// Responsabilidad: mostrar UNA venta con aspecto de ticket y permitir imprimirla.
// Usa Teleport para quedar directo dentro de <body>: así el CSS de impresión
// (body > *:not(dialog[open])) sigue mostrando solo el comprobante.
import { ref } from "vue";
import { useDialogo } from "../composables/useDialogo.js";
import { EMPRESA } from "../config.js";
import { soles, ETIQUETA_IGV } from "../utils.js";

export default {
  name: "Comprobante",
  props: {
    abierto: { type: Boolean, default: false },
    venta: { type: Object, default: null }
  },
  emits: ["cerrar"],
  setup(props) {
    const dialogo = ref(null);
    useDialogo(() => props.abierto, dialogo);

    const imprimir = () => window.print();
    const fechaHora = f => new Date(f).toLocaleString();

    return { dialogo, EMPRESA, ETIQUETA_IGV, soles, imprimir, fechaHora };
  },
  template: `
    <Teleport to="body">
      <dialog ref="dialogo" id="comprobante" data-bs-theme="light" @close="$emit('cerrar')">
        <template v-if="venta">
          <h3 class="h5 text-center">{{ EMPRESA.nombre }}</h3>
          <p v-if="venta.anulada" class="aviso">COMPROBANTE ANULADO<br>Motivo: {{ venta.motivo || "-" }}</p>
          <p class="text-center">{{ EMPRESA.razonSocial }}<br>RUC: {{ EMPRESA.ruc }}<br>{{ EMPRESA.direccion }}</p>
          <p>
            {{ venta.tipo.toUpperCase() }} {{ venta.numero }}<br>
            {{ fechaHora(venta.fecha) }} - Mesa {{ venta.mesa }}<br>
            Cliente: {{ venta.cliente }} ({{ venta.documento }})
          </p>
          <table class="table table-sm">
            <tbody>
              <tr v-for="(i, n) in venta.items" :key="n">
                <td>{{ i.cantidad }} x {{ i.nombre }}</td><td>{{ soles(i.precio * i.cantidad) }}</td>
              </tr>
              <tr><td>Subtotal</td><td>{{ soles(venta.subtotal) }}</td></tr>
              <tr><td>{{ ETIQUETA_IGV }}</td><td>{{ soles(venta.igv) }}</td></tr>
              <tr><td><b>TOTAL</b></td><td><b>{{ soles(venta.total) }}</b></td></tr>
            </tbody>
          </table>
          <p class="no-print d-flex gap-2 mb-0">
            <button class="btn btn-dark" @click="imprimir">Imprimir / PDF</button>
            <button class="btn btn-outline-secondary" @click="$emit('cerrar')">Cerrar</button>
          </p>
        </template>
      </dialog>
    </Teleport>
  `
};
