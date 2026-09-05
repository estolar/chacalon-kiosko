<?php

declare(strict_types=1);

const MAX_NEWS_IMPORT_URLS = 8;
const MAX_MANUAL_NEWS_ITEMS = 60;
const ARTICLE_FETCH_TIMEOUT_SECONDS = 15;
const MAX_ARTICLE_HTML_LENGTH = 2000000;
const STORE_PATH = __DIR__ . '/../data/manual-news.json';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

function sendJson(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function cleanText($value, int $maxLength, string $fallback = ''): string
{
    return is_string($value) && trim($value) !== '' ? trim(substr($value, 0, $maxLength)) : $fallback;
}

function isPublicUrl(string $rawUrl): bool
{
    $url = filter_var(trim($rawUrl), FILTER_VALIDATE_URL);
    if (!$url || !in_array(strtolower((string) parse_url($url, PHP_URL_SCHEME)), ['http', 'https'], true)) return false;
    $host = strtolower((string) parse_url($url, PHP_URL_HOST));
    if ($host === 'localhost' || $host === '127.0.0.1' || $host === '::1') return false;
    if (filter_var($host, FILTER_VALIDATE_IP) !== false && filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) return false;
    return true;
}

function fetchRemote(string $url): string
{
    if (!isPublicUrl($url)) throw new RuntimeException('El enlace no es público o no es válido.');

    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => ARTICLE_FETCH_TIMEOUT_SECONDS,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; ChacalonKiosko/1.0)',
            CURLOPT_HTTPHEADER => ['Accept: text/html,application/xhtml+xml,image/*'],
        ]);
        $body = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);
        curl_close($curl);
        if ($body === false || $status >= 400) throw new RuntimeException($error ?: "El sitio respondió HTTP {$status}.");
        return substr((string) $body, 0, MAX_ARTICLE_HTML_LENGTH);
    }

    $context = stream_context_create(['http' => [
        'method' => 'GET',
        'timeout' => ARTICLE_FETCH_TIMEOUT_SECONDS,
        'ignore_errors' => true,
        'header' => "User-Agent: Mozilla/5.0 (compatible; ChacalonKiosko/1.0)\r\nAccept: text/html,application/xhtml+xml,image/*\r\n",
    ]]);
    $body = file_get_contents($url, false, $context);
    if ($body === false) throw new RuntimeException('No se pudo leer el sitio.');
    return substr($body, 0, MAX_ARTICLE_HTML_LENGTH);
}

function decodeText(string $value): string
{
    return trim(preg_replace('/\s+/', ' ', html_entity_decode(strip_tags($value), ENT_QUOTES | ENT_HTML5, 'UTF-8')) ?: '');
}

function isListArray(array $value): bool
{
    if ($value === []) return true;
    return array_keys($value) === range(0, count($value) - 1);
}

function metaValue(string $html, array $names): string
{
    foreach ($names as $name) {
        $quoted = preg_quote($name, '/');
        if (preg_match('/<meta\b[^>]*(?:property|name)=["\']' . $quoted . '["\'][^>]*content=["\']([^"\']*)["\']/i', $html, $match)) return decodeText($match[1]);
        if (preg_match('/<meta\b[^>]*content=["\']([^"\']*)["\'][^>]*(?:property|name)=["\']' . $quoted . '["\']/i', $html, $match)) return decodeText($match[1]);
    }
    return '';
}

function jsonLdArticle(string $html): array
{
    preg_match_all('/<script[^>]+type=["\']application\/ld\+json["\'][^>]*>([\s\S]*?)<\/script>/i', $html, $matches);
    foreach ($matches[1] ?? [] as $rawJson) {
        $decoded = json_decode(trim($rawJson), true);
        $candidates = is_array($decoded) && isListArray($decoded) ? $decoded : [$decoded];
        foreach ($candidates as $candidate) {
            if (!is_array($candidate)) continue;
            $graph = is_array($candidate['@graph'] ?? null) ? $candidate['@graph'] : [$candidate];
            foreach ($graph as $entry) {
                if (is_array($entry) && (isset($entry['headline']) || isset($entry['articleBody']))) return $entry;
            }
        }
    }
    return [];
}

function articleImage($value): string
{
    if (is_string($value)) return filter_var($value, FILTER_VALIDATE_URL) ? $value : '';
    if (is_array($value)) {
        foreach (['url', 'contentUrl'] as $key) {
            if (!empty($value[$key]) && filter_var($value[$key], FILTER_VALIDATE_URL)) return $value[$key];
        }
        if (isset($value[0])) return articleImage($value[0]);
    }
    return '';
}

function articleSource(string $url, string $fallback): string
{
    if ($fallback !== '') return $fallback;
    $host = strtolower((string) parse_url($url, PHP_URL_HOST));
    $host = preg_replace('/^www\./', '', $host) ?: $host;
    if (strpos($host, 'larepublica') !== false) return 'La República';
    if (strpos($host, 'elcomercio') !== false) return 'El Comercio Perú';
    if (strpos($host, 'gestion') !== false) return 'Gestión';
    if (strpos($host, 'hildebrandtensustrece') !== false) return 'Hildebrandt en sus trece';
    return $host;
}

function articleCategory(string $text): string
{
    $text = strtolower($text);
    if (preg_match('/economía|economia|mef|bcrp|inversión|inversion|empresa|mercado|empleo|minera/', $text)) return 'economia';
    if (preg_match('/cultura|música|musica|cine|teatro|arte|libro|literatura/', $text)) return 'cultura';
    if (preg_match('/sociedad|salud|educación|educacion|seguridad|lima|barrio|deporte|tenis/', $text)) return 'sociedad';
    return 'politica';
}

function fetchArticle(string $url): array
{
    $html = fetchRemote($url);
    $json = jsonLdArticle($html);
    $title = cleanText($json['headline'] ?? '', 240) ?: metaValue($html, ['og:title', 'twitter:title', 'title']);
    if ($title === '') {
        preg_match('/<title\b[^>]*>([\s\S]*?)<\/title>/i', $html, $titleMatch);
        $title = decodeText($titleMatch[1] ?? '');
    }
    if ($title === '') throw new RuntimeException('No se pudo encontrar el titular.');

    $summary = cleanText($json['description'] ?? '', 1000) ?: metaValue($html, ['og:description', 'description', 'twitter:description']);
    $source = articleSource($url, metaValue($html, ['og:site_name']));
    $image = articleImage($json['image'] ?? '') ?: metaValue($html, ['og:image', 'twitter:image']);
    $publishedAt = cleanText($json['datePublished'] ?? '', 40) ?: metaValue($html, ['article:published_time', 'date']);
    $category = articleCategory("{$title} {$summary} " . cleanText($json['articleBody'] ?? '', 2000));

    return [
        'url' => substr($url, 0, 500),
        'title' => $title,
        'summary' => substr($summary, 0, 320),
        'source' => $source,
        'image' => substr($image, 0, 500),
        'publishedAt' => $publishedAt ?: gmdate('c'),
        'category' => $category,
    ];
}

function generateMetadata(array $article): array
{
    $configPath = dirname(__DIR__) . '/config/gemini.php';
    $serverConfig = is_file($configPath) ? require $configPath : [];
    $apiKey = getenv('GEMINI_API_KEY') ?: ($serverConfig['apiKey'] ?? '');
    $model = getenv('GEMINI_MODEL') ?: ($serverConfig['model'] ?? 'gemini-3.5-flash-lite');
    if (!is_string($apiKey) || trim($apiKey) === '') return $article;

    $endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent?key=' . rawurlencode($apiKey);
    $prompt = 'Eres editor de un kiosko peruano. Genera solo JSON válido con title, summary y category. Conserva el sentido, escribe un resumen propio de máximo 280 caracteres y elige exactamente politica, economia, sociedad o cultura. No inventes hechos.\n\nARTICULO\nFuente: ' . $article['source'] . '\nTitular: ' . $article['title'] . '\nDescripción: ' . $article['summary'];
    $payload = json_encode(['contents' => [['role' => 'user', 'parts' => [['text' => $prompt]]]], 'generationConfig' => ['temperature' => 0.2, 'maxOutputTokens' => 220, 'responseMimeType' => 'application/json']], JSON_UNESCAPED_UNICODE);
    list($status, $responseBody) = requestGemini($endpoint, $payload);
    if ($status < 200 || $status >= 300) return $article;
    $response = json_decode($responseBody, true) ?: [];
    $text = $response['candidates'][0]['content']['parts'][0]['text'] ?? '';
    $generated = json_decode(trim(preg_replace('/^```(?:json)?\s*|\s*```$/i', '', (string) $text)), true);
    if (!is_array($generated)) return $article;
    $category = in_array($generated['category'] ?? '', ['politica', 'economia', 'sociedad', 'cultura'], true) ? $generated['category'] : $article['category'];
    return array_merge($article, ['title' => cleanText($generated['title'] ?? '', 240, $article['title']), 'summary' => cleanText($generated['summary'] ?? '', 320, $article['summary']), 'category' => $category]);
}

function requestGemini(string $endpoint, string $body): array
{
    if (!function_exists('curl_init')) return [0, ''];
    $curl = curl_init($endpoint);
    curl_setopt_array($curl, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 28]);
    $response = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    return [$status, is_string($response) ? $response : ''];
}

function sanitizeNewsItem($item, $index = 0)
{
    if (!is_array($item)) return null;
    $title = cleanText($item['title'] ?? '', 240);
    if ($title === '') return null;
    $categories = ['politica', 'economia', 'sociedad', 'cultura'];
    $image = cleanText($item['image'] ?? ($item['imageUrl'] ?? ($item['thumbnail'] ?? '')), 500);
    return [
        'id' => cleanText($item['id'] ?? '', 120, 'manual-news-' . time() . '-' . $index),
        'category' => in_array($item['category'] ?? '', $categories, true) ? $item['category'] : 'politica',
        'title' => $title,
        'summary' => cleanText($item['summary'] ?? '', 320),
        'source' => cleanText($item['source'] ?? '', 100, 'EL KIOSKO'),
        'url' => filter_var($item['url'] ?? '', FILTER_VALIDATE_URL) ? substr((string) $item['url'], 0, 500) : '',
        'image' => $image,
        'publishedAt' => cleanText($item['publishedAt'] ?? '', 40, gmdate('c')),
        'priority' => is_numeric($item['priority'] ?? null) ? (int) $item['priority'] : 0,
        'active' => ($item['active'] ?? true) !== false,
        'isManual' => true,
    ];
}

function readStore()
{
    if (!is_file(STORE_PATH)) return [];
    $items = json_decode(file_get_contents(STORE_PATH) ?: '', true);
    return is_array($items) ? array_values(array_filter(array_map('sanitizeNewsItem', array_slice($items, 0, MAX_MANUAL_NEWS_ITEMS)))) : [];
}

function writeStore(array $items): void
{
    $directory = dirname(STORE_PATH);
    if (!is_dir($directory)) mkdir($directory, 0775, true);
    file_put_contents(STORE_PATH, json_encode($items, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT), LOCK_EX);
}

$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '';
$operation = preg_match('#/api/news/([^/]+)$#', $requestPath, $match) ? $match[1] : '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($operation === 'manual' && $method === 'GET') sendJson(200, ['items' => readStore()]);

$body = json_decode(file_get_contents('php://input') ?: '{}', true);
if (!is_array($body)) sendJson(400, ['error' => 'JSON inválido.']);

if ($operation === 'manual' && $method === 'PUT') {
    require_once dirname(__DIR__) . '/admin/_bootstrap.php';
    adminRequireAuth(true);
    if (!is_array($body['items'] ?? null)) sendJson(400, ['error' => 'La lista de noticias no es válida.']);
    $items = array_values(array_filter(array_map('sanitizeNewsItem', array_slice($body['items'], 0, MAX_MANUAL_NEWS_ITEMS))));
    writeStore($items);
    sendJson(200, ['items' => $items]);
}

if ($operation === 'import' && $method === 'POST') {
    require_once dirname(__DIR__) . '/admin/_bootstrap.php';
    adminRequireAuth(true);
    $urls = array_values(array_unique(array_filter(array_map('trim', is_array($body['urls'] ?? null) ? $body['urls'] : []))));
    if (!$urls) sendJson(400, ['error' => 'Pega al menos un enlace de noticia.']);
    $results = [];
    $errors = [];
    foreach (array_slice($urls, 0, MAX_NEWS_IMPORT_URLS) as $index => $url) {
        try {
            $article = generateMetadata(fetchArticle($url));
            $results[] = array_merge($article, ['id' => 'manual-import-' . time() . '-' . $index, 'priority' => 100 - $index, 'active' => true, 'isManual' => true]);
        } catch (Throwable $error) {
            $errors[] = ['url' => $url, 'error' => $error->getMessage()];
        }
    }
    sendJson($results ? 200 : 422, ['items' => $results, 'errors' => $errors]);
}

sendJson(404, ['error' => 'Route not found']);
