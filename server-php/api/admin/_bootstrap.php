<?php

declare(strict_types=1);

const CHACALON_ADMIN_SESSION_NAME = 'chacalon_admin';
const CHACALON_ADMIN_SESSION_TTL = 43200;

function adminSendJson(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, max-age=0');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function adminConfig(): array
{
    $configPath = dirname(__DIR__) . '/config/admin.php';
    if (!is_file($configPath)) return [];
    $config = require $configPath;
    return is_array($config) ? $config : [];
}

function adminStartSession(): void
{
    if (session_status() !== PHP_SESSION_NONE) return;

    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    session_name(CHACALON_ADMIN_SESSION_NAME);
    session_set_cookie_params([
        'lifetime' => CHACALON_ADMIN_SESSION_TTL,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();

    if (!empty($_SESSION['authenticatedAt']) && time() - (int) $_SESSION['authenticatedAt'] > CHACALON_ADMIN_SESSION_TTL) {
        $_SESSION = [];
        session_destroy();
        session_start();
    }
}

function adminIsAuthenticated(): bool
{
    adminStartSession();
    return !empty($_SESSION['authenticated']) && !empty($_SESSION['user']);
}

function adminCsrfToken(): string
{
    adminStartSession();
    if (empty($_SESSION['csrfToken'])) {
        $_SESSION['csrfToken'] = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    }
    return (string) $_SESSION['csrfToken'];
}

function adminRequestBody(): array
{
    $body = json_decode(file_get_contents('php://input') ?: '{}', true);
    return is_array($body) ? $body : [];
}

function adminRequireAuth(bool $requireCsrf = true): void
{
    if (!adminIsAuthenticated()) adminSendJson(401, ['error' => 'Sesión administrativa requerida.']);

    if ($requireCsrf) {
        $provided = (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
        $expected = adminCsrfToken();
        if ($provided === '' || !hash_equals($expected, $provided)) {
            adminSendJson(419, ['error' => 'Token de seguridad inválido o vencido.']);
        }
    }
}

function adminClearSession(): void
{
    adminStartSession();
    $_SESSION = [];
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', (bool) $params['secure'], (bool) $params['httponly']);
    session_destroy();
}

