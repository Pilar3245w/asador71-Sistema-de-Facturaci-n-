// COMPONENTE - Ventana del informe de ventas
// Responsabilidad: mostrar el resumen de un periodo (ya calculado) y permitir imprimirlo.
// Igual que el comprobante, usa Teleport para quedar directo dentro de <body>.
import { ref, computed } from "vue";
import { useDialogo } from "../composables/useDialogo.js";
import { EMPRESA } from "../config.js";
import { soles, formatoFecha } from "../utils.js";

export default {
  name: "InformeVentas",
  props: {
    abierto: { type: Boolean, default: false },
    // { resumen, desde, hasta, emitido }
    datos: { type: Object, default: null }
  },
  emits: ["cerrar"],
  setup(props) {
    const dialogo = ref(null);
    useDialogo(() => props.abierto, dialogo);

    const periodo = computed(() => {
      if (!props.datos) return "";
      const { desde, hasta } = props.datos;
      return desde === hasta ? formatoFecha(desde) : `${formatoFecha(desde)} al ${formatoFecha(hasta)}`;
    });
    const imprimir = () => window.print();

    return { dialogo, EMPRESA, soles, periodo, imprimir };
  },
  template: `
    <Teleport to="body">
      <dialog ref="dialogo" id="informe" data-bs-theme="light" @close="$emit('cerrar')">
        <template v-if="datos">
          <h3 class="h5 text-center">{{ EMPRESA.nombre }}</h3>
          <p class="text-center">INFORME DE VENTAS<br>Periodo: {{ periodo }}<br>Emitido: {{ datos.emitido }}</p>
          <table class="table table-sm">
            <tbody>
              <tr><td>N° de ventas</td><td>{{ datos.resumen.cantidad }}</td></tr>
              <tr><td>Boletas</td><td>{{ datos.resumen.boletas.n }} · {{ soles(datos.resumen.boletas.total) }}</td></tr>
              <tr><td>Facturas</td><td>{{ datos.resumen.facturas.n }} · {{ soles(datos.resumen.facturas.total) }}</td></tr>
              <tr><td>Subtotal (base)</td><td>{{ soles(datos.resumen.subtotal) }}</td></tr>
              <tr><td>IGV total</td><td>{{ soles(datos.resumen.igv) }}</td></tr>
              <tr><td><b>TOTAL VENDIDO</b></td><td><b>{{ soles(datos.resumen.total) }}</b></td></tr>
              <tr><td>Ticket promedio</td><td>{{ soles(datos.resumen.promedio) }}</td></tr>
              <tr><td>Ventas anuladas (no incluidas)</td><td>{{ datos.resumen.anuladas }}</td></tr>
            </tbody>
          </table>
          <h4 class="h6">Platos más vendidos</h4>
          <table class="table table-sm">
            <tbody>
              <tr v-for="(p, n) in datos.resumen.platos" :key="p.nombre">
                <td>{{ n + 1 }}. {{ p.nombre }}</td><td>{{ p.cantidad }} und · {{ soles(p.monto) }}</td>
              </tr>
              <tr v-if="!datos.resumen.platos.length"><td>Sin ventas en este periodo</td></tr>
            </tbody>
          </table>
          <p class="no-print small text-secondary">Para guardar en PDF: pulsa Imprimir y en Destino elige Guardar como PDF.</p>
          <p class="no-print d-flex gap-2 mb-0">
            <button class="btn btn-dark" @click="imprimir">Imprimir / PDF</button>
            <button class="btn btn-outline-secondary" @click="$emit('cerrar')">Cerrar</button>
          </p>
        </template>
      </dialog>
    </Teleport>
  `
};
