export class AppController {
  constructor(productos, pedido, vista, clientes) {
    this.productos = productos;
    this.pedido = pedido;
    this.vista = vista;
    this.clientes = clientes;
    this.vista.fijarRango(this.pedido.hoy(), this.pedido.hoy());
    this.eventos();
    this.iniciar();
  }

  // Carga todos los datos desde MySQL una sola vez al abrir la página
  async iniciar() {
    try {
      await Promise.all([
        this.productos.cargar(),
        this.pedido.cargarVentas(),
        this.clientes.cargar()
      ]);
    } catch (error) {
      alert("No se pudo conectar con la base de datos. ¿Están encendidos Apache y MySQL en XAMPP?\n" + error.message);
    }
    this.refrescar();
  }

  refrescar() {
    this.vista.renderProductos(this.productos.obtenerTodos());
    this.vista.renderPedido(this.pedido.items, this.pedido.totales());

    const { desde, hasta } = this.vista.leerRango();
    const ventas = this.pedido.ventasEntre(desde, hasta);
    this.vista.renderHistorial(ventas, this.pedido.informe(ventas));
  }

  // Devuelve un mensaje de error, o null si los datos del cliente están bien
  validarCliente({ tipo, documento, cliente }, total) {
    if (tipo === "Factura") {
      if (documento.length !== 11) return "Para emitir una factura ingresa un RUC de 11 dígitos.";
      if (!cliente) return "Escribe la razón social del cliente.";
    }
    if (tipo === "Boleta") {
      if (total > 700 && documento.length !== 8) {
        return "Las boletas mayores a S/ 700 requieren el DNI (8 dígitos) y el nombre del cliente.";
      }
      if (documento && documento.length !== 8) return "El DNI debe tener 8 dígitos.";
      if ((documento || total > 700) && !cliente) return "Escribe el nombre del cliente.";
    }
    return null;
  }

  eventos() {
    // Formulario de plato (nuevo o edición)
    document.getElementById("btn-nuevo").addEventListener("click", () => this.vista.abrirFormulario());
    document.getElementById("btn-cancelar").addEventListener("click", () => this.vista.cerrarFormulario());

    document.getElementById("form-producto").addEventListener("submit", async e => {
      e.preventDefault();
      const { id, nombre, precio, archivo } = this.vista.leerFormularioProducto();
      if (!nombre || isNaN(precio)) return;
      if (!id && !archivo) return alert("Elige una foto del plato.");

      try {
        const imagen = archivo ? await this.vista.leerImagen(archivo) : undefined;
        if (id) await this.productos.editar(id, { nombre, precio, imagen });
        else await this.productos.agregar(nombre, precio, imagen);
      } catch (error) {
        return alert("No se pudo guardar el plato: " + error.message);
      }
      this.vista.limpiarFormularioProducto();
      this.vista.cerrarFormulario();
      this.refrescar();
    });

    // Botones de la carta, del pedido y de la tabla de ventas
    document.body.addEventListener("click", async e => {
      const btn = e.target.closest("[data-accion]");
      if (!btn) return;
      const id = Number(btn.dataset.id);
      const acciones = {
        agregar: () => this.pedido.agregarItem(this.productos.buscar(id)),
        editar: () => this.vista.abrirFormulario(this.productos.buscar(id)),
        eliminar: async () => {
          if (confirm("¿Quitar este plato de la carta?")) await this.productos.eliminar(id);
        },
        mas: () => this.pedido.cambiarCantidad(id, 1),
        menos: () => this.pedido.cambiarCantidad(id, -1),
        ver: () => {
          const venta = this.pedido.buscarVenta(btn.dataset.numero);
          if (venta) this.vista.mostrarComprobante(venta);
        },
        anular: async () => {
          const numero = btn.dataset.numero;
          const motivo = (prompt(`Motivo para anular ${numero}:`) || "").trim();
          if (!motivo) return;
          if (confirm(`¿Anular ${numero}? Esta acción no se puede deshacer.`)) {
            await this.pedido.anular(numero, motivo);
          }
        }
      };

      try {
        await acciones[btn.dataset.accion]();
      } catch (error) {
        alert(error.message);
      }
      this.refrescar();
    });

    // Filtros, informe y exportación a Excel
    document.getElementById("desde").addEventListener("change", () => this.refrescar());
    document.getElementById("hasta").addEventListener("change", () => this.refrescar());
    document.getElementById("btn-hoy").addEventListener("click", () => {
      this.vista.fijarRango(this.pedido.hoy(), this.pedido.hoy());
      this.refrescar();
    });
    document.getElementById("btn-informe").addEventListener("click", () => {
      const { desde, hasta } = this.vista.leerRango();
      const ventas = this.pedido.ventasEntre(desde, hasta);
      this.vista.mostrarInforme(this.pedido.informe(ventas), desde, hasta);
    });
    document.getElementById("btn-excel").addEventListener("click", () => {
      const { desde, hasta } = this.vista.leerRango();
      const ventas = this.pedido.ventasEntre(desde, hasta);
      if (!ventas.length) return alert("No hay ventas en este rango para exportar.");
      this.vista.descargarArchivo(
        `ventas_${desde || "inicio"}_${hasta || "hoy"}.csv`,
        this.pedido.aCsv(ventas),
        "text/csv;charset=utf-8",
        true
      );
    });

    // Al completar un DNI (8) o RUC (11), busca el nombre del cliente
    const campoDoc = document.getElementById("documento");
    campoDoc.addEventListener("input", async () => {
      campoDoc.value = campoDoc.value.replace(/\D/g, "");
      const numero = campoDoc.value;

      if (numero.length !== 8 && numero.length !== 11) {
        this.vista.mostrarEstadoDoc("");
        return;
      }
      this.vista.mostrarEstadoDoc("Buscando...");
      try {
        const cliente = await this.clientes.consultar(numero);
        if (campoDoc.value !== numero) return;
        this.vista.llenarCliente(cliente.nombre);
        this.vista.mostrarEstadoDoc("✓ Encontrado");
      } catch (error) {
        this.vista.mostrarEstadoDoc(error.message);
      }
    });

    // Generar comprobante
    document.getElementById("btn-generar").addEventListener("click", async () => {
      if (!this.pedido.items.length) return alert("El pedido está vacío.");

      const datos = this.vista.leerDatosPedido();
      const error = this.validarCliente(datos, this.pedido.totales().total);
      if (error) return alert(error);

      try {
        await this.clientes.guardar(datos.documento, datos.cliente);
        const venta = await this.pedido.finalizar(datos);
        this.vista.limpiarCliente();
        this.vista.fijarRango(this.pedido.hoy(), this.pedido.hoy());
        this.refrescar();
        this.vista.mostrarComprobante(venta);
      } catch (error) {
        alert("No se pudo emitir el comprobante: " + error.message);
      }
    });
  }
}