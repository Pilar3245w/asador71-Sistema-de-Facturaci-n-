// Funciones de apoyo sin estado: cálculos y formatos que usan varios archivos.

// Debe coincidir con TASA_IGV de api/conexion.php
// 8% IGV + 2.5% IPM (MYPE restaurantes 2026)
export const TASA_IGV = 0.105;
export const ETIQUETA_IGV = `IGV ${(TASA_IGV * 100).toFixed(1)}%`;

export const soles = n => "S/ " + Number(n).toFixed(2);

// Vista previa del pedido en pantalla (el cálculo oficial lo hace el servidor)
export function calcularTotales(items) {
  const total = Math.round(items.reduce((s, i) => s + i.precio * i.cantidad, 0) * 100) / 100;
  const subtotal = Math.round((total / (1 + TASA_IGV)) * 100) / 100;
  const igv = Math.round((total - subtotal) * 100) / 100;
  return { subtotal, igv, total };
}

// Convierte una fecha a texto AAAA-MM-DD (hora local), para comparar con los filtros
export function fechaLocal(fecha) {
  const d = new Date(fecha);
  const dos = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

export const hoy = () => fechaLocal(new Date());

// AAAA-MM-DD -> DD/MM/AAAA
export const formatoFecha = s => (s ? s.split("-").reverse().join("/") : "inicio");

// Convierte la foto a texto y la reduce a 600px para que no pese
export function leerImagen(archivo) {
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

// Descarga un archivo de texto (CSV con BOM para que Excel lea bien las tildes)
export function descargarArchivo(nombre, texto, tipo, conBom = false) {
  const blob = new Blob([conBom ? "\ufeff" + texto : texto], { type: tipo });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(a.href);
}
