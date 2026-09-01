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

Subir el contenido de `build/` dentro de:

```text
/www/enriquestolar.com/chacalon-lab/
```

La carpeta debe conservar `.htaccess`, `index.html`, `manifest.json`, `static/`, `images/`, `audio/` y `data/`.

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
