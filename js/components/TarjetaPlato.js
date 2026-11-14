// COMPONENTE - Tarjeta de un plato
// Responsabilidad: mostrar UN plato (foto, nombre, precio) y avisar qué botón se pulsó.
// No guarda datos ni llama al servidor.
import { soles } from "../utils.js";

const FALLBACK = "img/placeholder.svg";

export default {
  name: "TarjetaPlato",
  props: {
    plato: { type: Object, required: true }
  },
  emits: ["agregar", "editar", "quitar"],
  setup() {
    // Si la foto no carga, se muestra la imagen de respaldo
    const fotoRota = e => {
      if (e.target.getAttribute("src") === FALLBACK) return;
      e.target.src = FALLBACK;
    };
    return { soles, FALLBACK, fotoRota };
  },
  template: `
    <article class="card plato flex-row h-100">
      <div class="card-body d-flex flex-column p-3">
        <h3 class="plato-nombre">{{ plato.nombre }}</h3>
        <p class="precio mb-2">{{ soles(plato.precio) }}</p>
        <div class="mt-auto d-flex align-items-center gap-3">
          <button class="btn btn-llama btn-sm" @click="$emit('agregar', plato)">Agregar</button>
          <button class="btn btn-link btn-sm p-0" @click="$emit('editar', plato)">Editar</button>
          <button class="btn btn-link btn-sm p-0" @click="$emit('quitar', plato)">Quitar</button>
        </div>
      </div>
      <img class="plato-img" :src="plato.imagen || FALLBACK" :alt="plato.nombre" @error="fotoRota">
    </article>
  `
};
