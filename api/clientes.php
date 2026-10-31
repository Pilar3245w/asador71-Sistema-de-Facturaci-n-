<?php
require 'conexion.php';

switch ($_SERVER['REQUEST_METHOD']) {

  // Devuelve { "documento": "nombre", ... }
  case 'GET':
    $mapa = [];
    foreach ($db->query('SELECT documento, nombre FROM clientes') as $f) {
      $mapa[$f['documento']] = $f['nombre'];
    }
    responder((object)$mapa);

  // Guarda el cliente, o actualiza su nombre si ya existía
  case 'POST':
    $d = leerJson();
    $documento = preg_replace('/\D/', '', $d['documento'] ?? '');
    $nombre = trim($d['nombre'] ?? '');
    if (!in_array(strlen($documento), [8, 11], true) || $nombre === '') {
      responder(['error' => 'Documento o nombre no válidos'], 400);
    }
    $db->prepare('INSERT INTO clientes (documento, nombre) VALUES (?, ?)
                  ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)')
       ->execute([$documento, $nombre]);
    responder(['ok' => true], 201);
}

responder(['error' => 'Método no permitido'], 405);