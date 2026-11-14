// COMPONENTE - Sección "Ventas"
// Responsabilidad: mostrar el historial con filtros de fecha, y los botones Hoy, Excel,
// Generar informe, Ver y Anular. Los datos vienen del store.
import { computed } from "vue";
import { desde, hasta, ventasFiltradas, resumen, anularVenta, irAHoy } from "../store.js";
import { ventasACsv } from "../reportes.js";
import { soles, descargarArchivo } from "../utils.js";

export default {
  name: "SeccionVentas",
  emits: ["ver", "informe"],
  setup() {
    const textoResumen = computed(() => {
      const r = resumen.value;
      return `${r.cantidad} ventas por ${soles(r.total)} · Boletas: ${r.boletas.n} · Facturas: ${r.facturas.n}` +
        (r.anuladas ? ` · Anuladas: ${r.anuladas}` : "");
    });

    const fechaTexto = f => new Date(f).toLocaleDateString("es-PE");
    const horaTexto = f => new Date(f).toLocaleTimeString("es-PE");

    function exportarExcel() {
      if (!ventasFiltradas.value.length) return alert("No hay ventas en este rango para exportar.");
      descargarArchivo(
        `ventas_${desde.value || "inicio"}_${hasta.value || "hoy"}.csv`,
        ventasACsv(ventasFiltradas.value),
        "text/csv;charset=utf-8",
        true
      );
    }

    async function anular(venta) {
      const motivo = (prompt(`Motivo para anular ${venta.numero}:`) || "").trim();
      if (!motivo) return;
      if (!confirm(`¿Anular ${venta.numero}? Esta acción no se puede deshacer.`)) return;
      try {
        await anularVenta(venta.numero, motivo);
      } catch (e) {
        alert(e.message);
      }
    }

    return { desde, hasta, ventas: ventasFiltradas, textoResumen, fechaTexto, horaTexto, soles, irAHoy, exportarExcel, anular };
  },
  template: `
    <section class="col-12">
      <div class="card">
        <div class="card-body">
          <div class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-2">
            <h2 class="h5 mb-0">Ventas</h2>
            <div class="d-flex flex-wrap align-items-end gap-2">
              <div>
                <label class="form-label small text-secondary mb-0" for="desde">Desde</label>
                <input type="date" id="desde" class="form-control form-control-sm" v-model="desde">
              </div>
              <div>
                <label class="form-label small text-secondary mb-0" for="hasta">Hasta</label>
                <input type="date" id="hasta" class="form-control form-control-sm" v-model="hasta">
              </div>
              <button class="btn btn-outline-light btn-sm" @click="irAHoy">Hoy</button>
              <button class="btn btn-outline-light btn-sm" @click="exportarExcel">Excel</button>
              <button class="btn btn-llama btn-sm" @click="$emit('informe')">Generar informe</button>
            </div>
          </div>

          <p class="text-secondary">{{ textoResumen }}</p>

          <div class="table-responsive">
            <table class="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>N°</th><th>Fecha</th><th>Hora</th><th>Mesa</th><th>Cliente</th>
                  <th class="text-end">Total</th><th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="v in ventas" :key="v.numero" :class="{ anulada: v.anulada }">
                  <td>{{ v.numero }} <span v-if="v.anulada" class="badge text-bg-danger">ANULADA</span></td>
                  <td>{{ fechaTexto(v.fecha) }}</td>
                  <td>{{ horaTexto(v.fecha) }}</td>
                  <td>{{ v.mesa }}</td>
                  <td>{{ v.cliente }}</td>
                  <td class="text-end">{{ soles(v.total) }}</td>
                  <td class="text-end text-nowrap">
                    <button class="btn btn-outline-light btn-sm" @click="$emit('ver', v)">Ver</button>
                    <button v-if="!v.anulada" class="btn btn-outline-danger btn-sm" @click="anular(v)">Anular</button>
                  </td>
                </tr>
                <tr v-if="!ventas.length">
                  <td colspan="7" class="text-secondary">No hay ventas en este rango de fechas.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `
};
