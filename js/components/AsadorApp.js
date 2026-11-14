// COMPONENTE RAÍZ - Asador 71
// Responsabilidad: unir los componentes (carta, pedido, ventas y ventanas) y decidir qué
// pasa cuando el usuario hace algo. No dibuja detalles ni habla con el servidor:
// para eso están los componentes hijos y el store.
import { ref, onMounted } from "vue";
import SeccionCarta from "./SeccionCarta.js";
import PanelPedido from "./PanelPedido.js";
import SeccionVentas from "./SeccionVentas.js";
import FormularioPlato from "./FormularioPlato.js";
import Comprobante from "./Comprobante.js";
import InformeVentas from "./InformeVentas.js";
import { productos, resumen, desde, hasta, cargarDatos, guardarPlato, quitarPlato, agregarAlPedido } from "../store.js";

export default {
  name: "AsadorApp",
  components: { SeccionCarta, PanelPedido, SeccionVentas, FormularioPlato, Comprobante, InformeVentas },
  setup() {
    // Formulario de plato
    const formAbierto = ref(false);
    const platoEnEdicion = ref(null);
    // Comprobante
    const comprobanteAbierto = ref(false);
    const ventaMostrada = ref(null);
    // Informe
    const informeAbierto = ref(false);
    const informeDatos = ref(null);

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

    function mostrarComprobante(venta) {
      if (!venta) return;
      ventaMostrada.value = venta;
      comprobanteAbierto.value = true;
    }

    // Se guarda una "foto" del informe para que no cambie mientras está abierto
    function abrirInforme() {
      informeDatos.value = {
        resumen: resumen.value,
        desde: desde.value,
        hasta: hasta.value,
        emitido: new Date().toLocaleString()
      };
      informeAbierto.value = true;
    }

    return {
      productos, agregarAlPedido,
      formAbierto, platoEnEdicion, nuevoPlato, editarPlato, cerrarFormulario, guardar, quitar,
      comprobanteAbierto, ventaMostrada, mostrarComprobante,
      informeAbierto, informeDatos, abrirInforme
    };
  },
  template: `
    <div class="row g-3">
      <SeccionCarta
        :platos="productos"
        @nuevo="nuevoPlato"
        @agregar="agregarAlPedido"
        @editar="editarPlato"
        @quitar="quitar" />

      <PanelPedido @emitida="mostrarComprobante" />

      <SeccionVentas @ver="mostrarComprobante" @informe="abrirInforme" />
    </div>

    <FormularioPlato :abierto="formAbierto" :plato="platoEnEdicion" @guardar="guardar" @cerrar="cerrarFormulario" />
    <Comprobante :abierto="comprobanteAbierto" :venta="ventaMostrada" @cerrar="comprobanteAbierto = false" />
    <InformeVentas :abierto="informeAbierto" :datos="informeDatos" @cerrar="informeAbierto = false" />
  `
};
