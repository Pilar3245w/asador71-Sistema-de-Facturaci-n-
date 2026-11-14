// COMPONENTE - Ventana "Nuevo plato / Editar plato"
// Responsabilidad: pedir nombre, precio y foto, y entregarlos al padre.
// No guarda en la base de datos: eso lo hace el store a través del servicio.
import { ref, watch } from "vue";
import { leerImagen } from "../utils.js";

export default {
  name: "FormularioPlato",
  props: {
    abierto: { type: Boolean, default: false },
    plato: { type: Object, default: null }   // null = plato nuevo
  },
  emits: ["guardar", "cerrar"],
  setup(props, { emit }) {
    const dialogo = ref(null);
    const entradaFoto = ref(null);
    const nombre = ref("");
    const precio = ref("");
    const archivo = ref(null);
    const guardando = ref(false);

    // Abre o cierra la ventana según lo que indique el padre
    watch(() => props.abierto, abierto => {
      const d = dialogo.value;
      if (!d) return;
      if (abierto) {
        nombre.value = props.plato ? props.plato.nombre : "";
        precio.value = props.plato ? props.plato.precio : "";
        archivo.value = null;
        if (entradaFoto.value) entradaFoto.value.value = "";
        if (!d.open) d.showModal();
      } else if (d.open) {
        d.close();
      }
    });

    async function enviar() {
      const precioNum = parseFloat(precio.value);
      if (!nombre.value.trim() || isNaN(precioNum)) return;
      if (!props.plato && !archivo.value) return alert("Elige una foto del plato.");

      guardando.value = true;
      try {
        const imagen = archivo.value ? await leerImagen(archivo.value) : undefined;
        emit("guardar", {
          id: props.plato ? props.plato.id : null,
          nombre: nombre.value.trim(),
          precio: precioNum,
          imagen
        });
      } catch {
        alert("No se pudo leer la imagen. Prueba con otra foto.");
      } finally {
        guardando.value = false;
      }
    }

    return { dialogo, entradaFoto, nombre, precio, archivo, guardando, enviar };
  },
  template: `
    <dialog ref="dialogo" id="dialogo-plato" @close="$emit('cerrar')">
      <form class="d-grid gap-3" @submit.prevent="enviar">
        <h3 class="h5 mb-0">{{ plato ? "Editar plato" : "Nuevo plato" }}</h3>
        <div>
          <label class="form-label" for="nombre-p">Nombre</label>
          <input id="nombre-p" class="form-control" v-model="nombre" placeholder="Ej: Lomo fino" required>
        </div>
        <div>
          <label class="form-label" for="precio-p">Precio (S/)</label>
          <input id="precio-p" class="form-control" type="number" step="0.01" min="0" v-model="precio" required>
        </div>
        <div>
          <label class="form-label" for="imagen-p">{{ plato ? "Foto (vacía = mantener la actual)" : "Foto del plato" }}</label>
          <input id="imagen-p" ref="entradaFoto" class="form-control" type="file" accept="image/*"
                 @change="archivo = $event.target.files[0] || null">
        </div>
        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-light" @click="$emit('cerrar')">Cancelar</button>
          <button type="submit" class="btn btn-llama" :disabled="guardando">Guardar</button>
        </div>
      </form>
    </dialog>
  `
};
