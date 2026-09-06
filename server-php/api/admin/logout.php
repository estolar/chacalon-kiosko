<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') adminSendJson(405, ['error' => 'Método no permitido.']);
adminRequireAuth(true);
adminClearSession();
adminSendJson(200, ['ok' => true]);

