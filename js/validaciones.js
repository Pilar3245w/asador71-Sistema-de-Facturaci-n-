// REGLAS DE NEGOCIO (SUNAT) para los datos del cliente.
// Devuelve un mensaje de error, o null si los datos están bien.
// El servidor vuelve a validar lo mismo por seguridad.
export function validarCliente({ tipo, documento, cliente }, total) {
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
