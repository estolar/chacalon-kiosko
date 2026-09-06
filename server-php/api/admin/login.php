<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') adminSendJson(405, ['error' => 'Método no permitido.']);

$config = adminConfig();
if (empty($config['username']) || empty($config['passwordHash'])) {
    adminSendJson(503, ['error' => 'El administrador no está configurado en el servidor.']);
}

adminStartSession();
$now = time();
$windowStarted = (int) ($_SESSION['loginWindowStarted'] ?? $now);
$attempts = (int) ($_SESSION['loginAttempts'] ?? 0);
if ($now - $windowStarted >= 900) {
    $windowStarted = $now;
    $attempts = 0;
}
if ($attempts >= 5) adminSendJson(429, ['error' => 'Demasiados intentos. Espera unos minutos e inténtalo otra vez.']);

$body = adminRequestBody();
$username = is_string($body['username'] ?? null) ? trim($body['username']) : '';
$password = is_string($body['password'] ?? null) ? $body['password'] : '';
$validUser = hash_equals((string) $config['username'], $username);
$validPassword = password_verify($password, (string) $config['passwordHash']);

if (!$validUser || !$validPassword) {
    $_SESSION['loginWindowStarted'] = $windowStarted;
    $_SESSION['loginAttempts'] = $attempts + 1;
    adminSendJson(401, ['error' => 'Usuario o contraseña incorrectos.']);
}

session_regenerate_id(true);
$_SESSION['authenticated'] = true;
$_SESSION['user'] = (string) $config['username'];
$_SESSION['authenticatedAt'] = $now;
$_SESSION['loginAttempts'] = 0;
$_SESSION['loginWindowStarted'] = $now;

adminSendJson(200, ['user' => $_SESSION['user'], 'csrfToken' => adminCsrfToken()]);

