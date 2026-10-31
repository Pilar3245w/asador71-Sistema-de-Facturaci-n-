<?php
date_default_timezone_set('America/Lima');

// Debe coincidir con TASA_IGV de js/models/PedidoModel.js
// 8% IGV + 2.5% IPM (MYPE restaurantes 2026). Cambia en los dos lugares en 2027.
const TASA_IGV = 0.105;

// CORS: permite que Live Server (cualquier puerto en localhost) llame a esta API
$origen = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('#^http://(localhost|127\.0\.0\.1)(:\d+)?$#', $origen)) {
  header("Access-Control-Allow-Origin: $origen");
  header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// El navegador manda primero una consulta de permiso (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

function responder($datos, $codigo = 200) {
  http_response_code($codigo);
  echo json_encode($datos, JSON_UNESCAPED_UNICODE);
  exit;
}

function leerJson() {
  return json_decode(file_get_contents('php://input'), true) ?? [];
}

// Cualquier error inesperado se devuelve como JSON (el detalle es solo para desarrollo)
set_exception_handler(function ($e) {
  responder(['error' => 'Error del servidor', 'detalle' => $e->getMessage()], 500);
});

try {
  $db = new PDO('mysql:host=localhost;dbname=asador71;charset=utf8mb4', 'root', '', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
} catch (PDOException $e) {
  responder(['error' => 'No se pudo conectar a la base de datos'], 500);
}