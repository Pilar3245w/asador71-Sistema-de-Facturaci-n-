// COMPONENTE - Sección "Carta"
// Responsabilidad: mostrar el encabezado y la lista de platos usando TarjetaPlato.
// Recibe los platos por props y avisa al padre lo que el usuario quiere hacer.
import TarjetaPlato from "./TarjetaPlato.js";

export default {
  name: "SeccionCarta",
  components: { TarjetaPlato },
  props: {
    platos: { type: Array, default: () => [] }
  },
  emits: ["nuevo", "agregar", "editar", "quitar"],
  template: `
    <section class="col-lg-8">
      <div class="card h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="h5 mb-0">Carta</h2>
            <button class="btn btn-llama" @click="$emit('nuevo')">+ Nuevo plato</button>
          </div>
          <div v-if="platos.length" class="row g-3">
            <div v-for="p in platos" :key="p.id" class="col-12 col-md-6">
              <TarjetaPlato
                :plato="p"
                @agregar="$emit('agregar', $event)"
                @editar="$emit('editar', $event)"
                @quitar="$emit('quitar', $event)" />
            </div>
          </div>
          <p v-else class="text-secondary">Aún no hay platos. Agrega el primero con "Nuevo plato".</p>
        </div>
      </div>
    </section>
  `
};
