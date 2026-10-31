import { TASA_IGV } from "../models/PedidoModel.js";

const FALLBACK = "img/placeholder.svg";

const EMPRESA = {
  nombre: "ASADOR 71",
  razonSocial: "ASADOR 71 S.A.C.",
  ruc: "20615796345",
  direccion: "CAL. ALFONSO UGARTE 320A MOLLENDO - ISLAY - AREQUIPA"
};

const ETQ_IGV = `IGV ${(TASA_IGV * 100).toFixed(1)}%`;
const $ = id => document.getElementById(id);
const soles = n => "S/ " + n.toFixed(2);
const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtFecha = s => (s ? s.split("-").reverse().join("/") : "inicio");

export class Vista {
  renderProductos(productos) {
    $("lista-productos").innerHTML = productos.length ? productos.map(p => `
      <div class="col-12 col-md-6">
        <article class="card plato flex-row h-100">
          <div class="card-body d-flex flex-column p-3">
            <h3 class="plato-nombre">${esc(p.nombre)}</h3>
            <p class="precio mb-2">${soles(p.precio)}</p>
            <div class="mt-auto d-flex align-items-center gap-3">
              <button class="btn btn-llama btn-sm" data-accion="agregar" data-id="${p.id}">Agregar</button>
              <button class="btn btn-link btn-sm p-0" data-accion="editar" data-id="${p.id}">Editar</button>
              <button class="btn btn-link btn-sm p-0" data-accion="eliminar" data-id="${p.id}">Quitar</button>
            </div>
          </div>
          <img class="plato-img" src="${esc(p.imagen || FALLBACK)}" alt="${esc(p.nombre)}" onerror="this.onerror=null;this.src='${FALLBACK}'">
        </article>
      </div>`).join("")
      : `<p class="text-secondary">Aún no hay platos. Agrega el primero con "Nuevo plato".</p>`;
  }

  renderPedido(items, t) {
    $("lista-pedido").innerHTML = items.length ? items.map(i => `
      <li class="list-group-item d-flex align-items-center gap-2 px-0">
        <div class="flex-grow-1">${esc(i.nombre)}<small class="d-block text-secondary">${soles(i.precio)} c/u</small></div>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-llama btn-sm rounded-circle cant-btn" data-accion="menos" data-id="${i.id}">−</button>
          <b>${i.cantidad}</b>
          <button class="btn btn-llama btn-sm rounded-circle cant-btn" data-accion="mas" data-id="${i.id}">+</button>
        </div>
        <span class="sub">${soles(i.precio * i.cantidad)}</span>
      </li>`).join("")
      : `<li class="list-group-item px-0 text-secondary">Agrega platos desde la carta.</li>`;
    $("subtotal").textContent = soles(t.subtotal);
    $("etq-igv").textContent = ETQ_IGV;
    $("igv").textContent = soles(t.igv);
    $("total").textContent = soles(t.total);
  }

  renderHistorial(ventas, r) {
    $("resumen").textContent =
      `${r.cantidad} ventas por ${soles(r.total)} · Boletas: ${r.boletas.n} · Facturas: ${r.facturas.n}` +
      (r.anuladas ? ` · Anuladas: ${r.anuladas}` : "");

    $("tabla-ventas").innerHTML = ventas.length ? ventas.map(v => {
      const f = new Date(v.fecha);
      return `
        <tr class="${v.anulada ? "anulada" : ""}">
          <td>${v.numero}${v.anulada ? ' <span class="badge text-bg-danger">ANULADA</span>' : ""}</td>
          <td>${f.toLocaleDateString("es-PE")}</td>
          <td>${f.toLocaleTimeString("es-PE")}</td>
          <td>${v.mesa}</td>
          <td>${esc(v.cliente)}</td>
          <td class="text-end">${soles(v.total)}</td>
          <td class="text-end text-nowrap">
            <button class="btn btn-outline-light btn-sm" data-accion="ver" data-numero="${v.numero}">Ver</button>
            ${v.anulada ? "" : `<button class="btn btn-outline-danger btn-sm" data-accion="anular" data-numero="${v.numero}">Anular</button>`}
          </td>
        </tr>`;
    }).join("")
      : `<tr><td colspan="7" class="text-secondary">No hay ventas en este rango de fechas.</td></tr>`;
  }

  mostrarComprobante(v) {
    const d = $("comprobante");
    d.innerHTML = `
      <h3 class="h5 text-center">${EMPRESA.nombre}</h3>
      ${v.anulada ? `<p class="aviso">COMPROBANTE ANULADO<br>Motivo: ${esc(v.motivo || "-")}</p>` : ""}
      <p class="text-center">${EMPRESA.razonSocial}<br>RUC: ${EMPRESA.ruc}<br>${EMPRESA.direccion}</p>
      <p>${v.tipo.toUpperCase()} ${v.numero}<br>
      ${new Date(v.fecha).toLocaleString()} - Mesa ${v.mesa}<br>
      Cliente: ${esc(v.cliente)} (${esc(v.documento)})</p>
      <table class="table table-sm">${v.items.map(i => `<tr><td>${i.cantidad} x ${esc(i.nombre)}</td><td>${soles(i.precio * i.cantidad)}</td></tr>`).join("")}
      <tr><td>Subtotal</td><td>${soles(v.subtotal)}</td></tr>
      <tr><td>${ETQ_IGV}</td><td>${soles(v.igv)}</td></tr>
      <tr><td><b>TOTAL</b></td><td><b>${soles(v.total)}</b></td></tr></table>
      <p class="no-print d-flex gap-2 mb-0">
        <button class="btn btn-dark" onclick="window.print()">Imprimir / PDF</button>
        <button class="btn btn-outline-secondary" onclick="this.closest('dialog').close()">Cerrar</button>
      </p>`;
    d.showModal();
  }

  mostrarInforme(r, desde, hasta) {
    const periodo = desde === hasta ? fmtFecha(desde) : `${fmtFecha(desde)} al ${fmtFecha(hasta)}`;
    const d = $("informe");
    d.innerHTML = `
      <h3 class="h5 text-center">${EMPRESA.nombre}</h3>
      <p class="text-center">INFORME DE VENTAS<br>Periodo: ${periodo}<br>Emitido: ${new Date().toLocaleString()}</p>
      <table class="table table-sm">
        <tr><td>N° de ventas</td><td>${r.cantidad}</td></tr>
        <tr><td>Boletas</td><td>${r.boletas.n} · ${soles(r.boletas.total)}</td></tr>
        <tr><td>Facturas</td><td>${r.facturas.n} · ${soles(r.facturas.total)}</td></tr>
        <tr><td>Subtotal (base)</td><td>${soles(r.subtotal)}</td></tr>
        <tr><td>IGV total</td><td>${soles(r.igv)}</td></tr>
        <tr><td><b>TOTAL VENDIDO</b></td><td><b>${soles(r.total)}</b></td></tr>
        <tr><td>Ticket promedio</td><td>${soles(r.promedio)}</td></tr>
        <tr><td>Ventas anuladas (no incluidas)</td><td>${r.anuladas}</td></tr>
      </table>
      <h4 class="h6">Platos más vendidos</h4>
      <table class="table table-sm">${r.platos.length
        ? r.platos.map((p, i) => `<tr><td>${i + 1}. ${esc(p.nombre)}</td><td>${p.cantidad} und · ${soles(p.monto)}</td></tr>`).join("")
        : `<tr><td>Sin ventas en este periodo</td></tr>`}</table>
      <p class="no-print small text-secondary">Para guardar en PDF: pulsa Imprimir y en Destino elige Guardar como PDF.</p>
      <p class="no-print d-flex gap-2 mb-0">
        <button class="btn btn-dark" onclick="window.print()">Imprimir / PDF</button>
        <button class="btn btn-outline-secondary" onclick="this.closest('dialog').close()">Cerrar</button>
      </p>`;
    d.showModal();
  }

  // Descarga un archivo de texto (CSV con BOM para que Excel lea bien las tildes)
  descargarArchivo(nombre, texto, tipo, conBom = false) {
    const blob = new Blob([conBom ? "\ufeff" + texto : texto], { type: tipo });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  leerRango() { return { desde: $("desde").value, hasta: $("hasta").value }; }
  fijarRango(desde, hasta) { $("desde").value = desde; $("hasta").value = hasta; }

  leerFormularioProducto() {
    return {
      id: Number($("id-p").value) || null,
      nombre: $("nombre-p").value.trim(),
      precio: parseFloat($("precio-p").value),
      archivo: $("imagen-p").files[0]
    };
  }
  limpiarFormularioProducto() { $("form-producto").reset(); }

  // Abre el formulario vacío (plato nuevo) o con los datos de un plato (editar)
  abrirFormulario(p = null) {
    $("form-producto").reset();
    $("id-p").value = p ? p.id : "";
    $("titulo-dialogo").textContent = p ? "Editar plato" : "Nuevo plato";
    $("etq-foto").textContent = p ? "Foto (vacía = mantener la actual)" : "Foto del plato";
    $("nombre-p").value = p ? p.nombre : "";
    $("precio-p").value = p ? p.precio : "";
    $("dialogo-plato").showModal();
  }
  cerrarFormulario() { $("dialogo-plato").close(); }

  // Convierte la foto a texto y la reduce a 600px para que no pese
  leerImagen(archivo) {
    return new Promise((ok, fallo) => {
      const lector = new FileReader();
      lector.onerror = fallo;
      lector.onload = () => {
        const img = new Image();
        img.onerror = fallo;
        img.onload = () => {
          const escala = Math.min(1, 600 / img.width);
          const c = document.createElement("canvas");
          c.width = img.width * escala;
          c.height = img.height * escala;
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          ok(c.toDataURL("image/jpeg", 0.8));
        };
        img.src = lector.result;
      };
      lector.readAsDataURL(archivo);
    });
  }

  leerDatosPedido() {
    return { mesa: $("mesa").value, tipo: $("tipo").value, cliente: $("cliente").value.trim(), documento: $("documento").value.trim() };
  }

  mostrarEstadoDoc(texto) { $("estado-doc").textContent = texto; }
  llenarCliente(nombre) { $("cliente").value = nombre; }

  limpiarCliente() {
    $("cliente").value = "";
    $("documento").value = "";
    $("estado-doc").textContent = "";
  }
}