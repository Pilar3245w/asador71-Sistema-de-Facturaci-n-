export const API_URL = "http://localhost/asador71-api";

// Envía una petición a la API y devuelve la respuesta ya convertida
export async function pedir(ruta, metodo = "GET", cuerpo = null) {
  const r = await fetch(`${API_URL}/${ruta}`, {
    method: metodo,
    headers: cuerpo ? { "Content-Type": "application/json" } : {},
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });

  let datos = {};
  try { datos = await r.json(); } catch { /* respuesta vacía */ }

  if (!r.ok) throw new Error(datos.error || "Error del servidor (" + r.status + ")");
  return datos;
}