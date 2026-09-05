# Despliegue por entorno

El proyecto usa `PUBLIC_URL` para resolver assets, API y `BrowserRouter`. La variable `REACT_APP_SITE_URL` se utiliza para los metadatos de compartir en redes sociales.

## Staging

Desde PowerShell, en la raíz del proyecto:

```powershell
npm ci
$env:CI = "true"
npm test -- --watchAll=false --runInBand
$env:PUBLIC_URL = "/chacalon-lab"
$env:REACT_APP_SITE_URL = "https://enriquestolar.com/chacalon-lab"
npm run build
```

Para probar solamente la pantalla de acceso en localhost, sin usar credenciales de producción:

```powershell
$env:REACT_APP_ADMIN_AUTH = "local"
$env:REACT_APP_ADMIN_USERNAME = "admin"
$env:REACT_APP_ADMIN_PASSWORD = "chacalon-local"
npm start
```

Ese modo es una simulación visual del login y guarda la sesión únicamente en `sessionStorage`; no reemplaza la autenticación PHP del hosting.

Subir el contenido de `build/` dentro de:

```text
/www/enriquestolar.com/chacalon-lab/
```

La carpeta debe conservar `.htaccess`, `index.html`, `manifest.json`, `static/`, `images/`, `audio/` y `data/`.

## Administrador de noticias

La lectura de noticias del kiosko es pública, pero el administrador requiere sesión para importar, guardar, reordenar, eliminar o generar imágenes.

1. Sube el contenido de `server-php/api/` dentro de la carpeta `api/` de la instalación, conservando `admin/`, `news/`, `ai/`, `config/` y `data/`.
2. En el hosting copia `api/config/admin.php.example` como `api/config/admin.php`.
3. Genera un hash de contraseña en una terminal con PHP:

   ```powershell
   php -r "echo password_hash('TU_CONTRASEÑA', PASSWORD_DEFAULT), PHP_EOL;"
   ```

4. Coloca el usuario y el hash generado en `api/config/admin.php`. No subas ese archivo a Git ni lo incluyas en un ZIP público.
5. Verifica que `api/config/.htaccess` y `api/data/.htaccess` sigan presentes; evitan descargar configuración y datos.

La sesión usa cookie `HttpOnly`, `SameSite=Lax`, vencimiento de 12 horas y token CSRF en las operaciones de escritura. Si no existe `admin.php`, el panel no permite operar y muestra que falta configuración.

## Producción nueva

La compilación de producción utilizará la misma fuente, cambiando únicamente las variables de ruta:

```powershell
$env:PUBLIC_URL = "/kiosko-chacalon"
$env:REACT_APP_SITE_URL = "https://enriquestolar.com/kiosko-chacalon"
npm run build
```

Subir el resultado a:

```text
/www/enriquestolar.com/kiosko-chacalon/
```

La ruta anterior `/chacalon/` no se reemplaza ni se borra.

## Verificación después de subir

1. Abrir la URL desde una ventana incógnito.
2. Comprobar que cargan imágenes, audio, CSS y JavaScript.
3. Escribir un mensaje y verificar `/api/ai/chat.php` en Network.
4. Confirmar que la respuesta sea `200` o que aparezca el fallback local.
5. Revisar que el contexto tenga fecha de actualización.
6. Probar el enlace de compartir en WhatsApp y Facebook.
7. Probar una ruta inexistente para validar el fallback de `.htaccess`.
