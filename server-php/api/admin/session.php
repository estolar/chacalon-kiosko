<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') adminSendJson(405, ['error' => 'Método no permitido.']);
if (!adminConfig()) adminSendJson(503, ['error' => 'El administrador no está configurado en el servidor.']);
if (!adminIsAuthenticated()) adminSendJson(401, ['error' => 'Sesión administrativa requerida.']);

adminSendJson(200, ['user' => (string) $_SESSION['user'], 'csrfToken' => adminCsrfToken()]);

