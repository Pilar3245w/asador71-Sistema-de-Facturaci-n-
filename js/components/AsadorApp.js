// COMPONENTE RAÍZ - Asador 71
// Responsabilidad: unir los componentes (carta, pedido, formulario) y decidir qué
// pasa cuando el usuario hace algo. No dibuja detalles ni habla con el servidor:
// para eso están los componentes hijos y el store.
import { ref, onMounted } from "vue";
import SeccionCarta from "./SeccionCarta.js";
import PanelPedido from "./PanelPedido.js";
import FormularioPlato from "./FormularioPlato.js";
import { productos, cargarDatos, guardarPlato, quitarPlato, agregarAlPedido } from "../store.js";

export default {
  name: "AsadorApp",
  components: { SeccionCarta, PanelPedido, FormularioPlato },
  setup() {
    const formAbierto = ref(false);
    const platoEnEdicion = ref(null);

    onMounted(async () => {
      try {
        await cargarDatos();
      } catch (error) {
        alert("No se pudo conectar con la base de datos. ¿Están encendidos Apache y MySQL en XAMPP?\n" + error.message);
      }
    });

    const nuevoPlato = () => { platoEnEdicion.value = null; formAbierto.value = true; };
    const editarPlato = plato => { platoEnEdicion.value = plato; formAbierto.value = true; };
    const cerrarFormulario = () => { formAbierto.value = false; };

    async function guardar(datos) {
      try {
        await guardarPlato(datos);
        cerrarFormulario();
      } catch (error) {
        alert("No se pudo guardar el plato: " + error.message);
      }
    }

    async function quitar(plato) {
      if (!confirm("¿Quitar este plato de la carta?")) return;
      try {
        await quitarPlato(plato.id);
      } catch (error) {
        alert(error.message);
      }
    }

    return { productos, agregarAlPedido, formAbierto, platoEnEdicion, nuevoPlato, editarPlato, cerrarFormulario, guardar, quitar };
  },
  template: `
    <div class="row g-3">
      <SeccionCarta
        :platos="productos"
        @nuevo="nuevoPlato"
        @agregar="agregarAlPedido"
        @editar="editarPlato"
        @quitar="quitar" />

      <PanelPedido />

      <section class="col-12">
        <div class="card">
          <div class="card-body">
            <h2 class="h5 mb-2">Ventas</h2>
            <p class="text-secondary mb-0">El historial, la anulación, el informe y la exportación a Excel se pasan a Vue en la etapa 2.</p>
          </div>
        </div>
      </section>
    </div>

    <FormularioPlato :abierto="formAbierto" :plato="platoEnEdicion" @guardar="guardar" @cerrar="cerrarFormulario" />
  `
};
