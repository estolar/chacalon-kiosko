# Conversando con Chacalón Virtual

## Propósito

Esta experiencia añade un personaje conversacional al arcade. Es un homenaje interactivo inspirado respetuosamente en Chacalón; no pretende ser la persona real ni generar una identidad auténtica.

## Arquitectura

```text
ChacalonChat.jsx
    │
    │ POST /api/ai/chat
    ▼
server/aiProxy.js (local)
    │
    │ Gemini API
    ▼
Respuesta del modelo

En producción, Freehostia utiliza `server-php/api/ai/chat.php` con la misma ruta de
Gemini. La clave se guarda en `api/config/gemini.php` únicamente dentro del hosting.
```

React mantiene el historial visual, el estado de conexión y el formulario. El proxy
recibe el mensaje, limita el tamaño del historial, añade las instrucciones de
personaje y llama a Gemini. La API key nunca se envía al navegador.

El reproductor usa un elemento `<audio>` oculto para conservar la reproducción
completa en loop y un `AnalyserNode` de Web Audio para alimentar un `<canvas>`.
Ese canvas dibuja barras de frecuencia, ondas, anillos de pulso y scanlines con
los colores neon del arcade. Si el navegador no ofrece Web Audio, la canción y
los controles siguen funcionando sin el visualizador.

## Contexto diario gratuito

Chacalón puede conversar sobre actualidad peruana, economía, sociedad, cultura y
recomendaciones sin consultar una API de búsqueda de pago en cada mensaje. El
proyecto usa un pequeño paquete JSON actualizado por GitHub Actions:

```text
Fuentes RSS públicas de Google News
            │  (cada hora)
            ▼
scripts/update-context.js
            │
            ├── public/data/context.json
            └── data/recommendations.json
                         (lugares verificados por el autor)
```

El workflow `.github/workflows/update-context.yml` se ejecuta cada hora y también
puede lanzarse manualmente desde la pestaña **Actions** de GitHub. Solo se guardan títulos,
fuente, fecha, resumen corto y enlaces; si todas
las fuentes fallan, el workflow no reemplaza el archivo anterior.

Las búsquedas cubren política peruana —con foco en Keiko, ministros, Gobierno y Congreso—,
economía, sociedad, negocios, emprendimiento, ideas, inteligencia artificial, tecnología,
redes sociales, tendencias, farándula, cultura y eventos.

La interfaz carga el archivo al abrir el chat y lo vuelve a consultar cada hora. En
desarrollo usa `/data/context.json`; en producción usa por defecto la versión pública
de GitHub. También se puede configurar `REACT_APP_CONTEXT_URL`:

```powershell
$env:REACT_APP_CONTEXT_URL="https://raw.githubusercontent.com/estolar/retro-games-streaming/main/public/data/context.json"
```

El mensaje solo envía el contexto al servidor cuando parece pedir actualidad,
lugares, eventos o recomendaciones. El proxy vuelve a filtrarlo y lo marca como
referencia, nunca como instrucciones. Esto reduce tokens en las conversaciones
normales y evita que el contenido de una fuente externa pueda cambiar las reglas
del personaje.

La caja de conversación también ofrece dos paletas rápidas. `/` muestra acciones
como noticias, política, música o juegos y las ejecuta al elegirlas. `@` muestra
personas, instituciones y temas que aparecen en el contexto diario; por ejemplo,
`@kk` propone a Keiko Fujimori. Al elegir una mención se inserta el término en el
mensaje para que el jugador complete su pregunta. Las coincidencias se ordenan
por presencia en las noticias actuales y el servidor conserva el contexto como
referencia, sin tratar los titulares como instrucciones.

Las recomendaciones comerciales no se inventan. Para añadir un lugar real se
edita `data/recommendations.json` con nombre, distrito, descripción y un enlace
verificado. Mientras la lista esté vacía, Chacalón puede conversar sobre el
contexto y sugerir criterios generales, pero no debe presentar negocios concretos
como si estuvieran comprobados.

## Estados principales

- `READY`: conversación lista para comenzar.
- La conversación comienza con un saludo que pide explícitamente el nombre; si no hay un nombre guardado, el primer mensaje se interpreta como el nombre del jugador.
- `CONNECTING`: solicitud en curso; se deshabilita el formulario.
- `ONLINE`: Gemini respondió correctamente.
- `OFFLINE`: Gemini no respondió y se muestra una respuesta local de respaldo.

## Decisiones de codificación

- La conversación se limita a 1200 caracteres por mensaje.
- Solo se envían los últimos doce mensajes como contexto de conversación.
- El proxy aplica un límite local de 20 solicitudes por minuto.
- El fallback permite estudiar y probar la interfaz sin conexión.
- La interfaz divide el escenario en dos columnas de igual ancho: retrato arcade y conversación; en móvil se apilan.
- El personaje usa un tono peruano, criollo y barrial, con buenos deseos, sin afirmar que sea Chacalón real.
- Si le piden dinero, el personaje no promete prestarlo: responde con una ocurrencia recursera y buenos deseos.
- El nombre del jugador se guarda en `localStorage` y puede actualizarse varias veces durante la conversación.
- La memoria local conserva hasta veinte aportes recientes del jugador en `chacalon-virtual.profile`; sirve como contexto breve y no como una base de datos permanente. Se mantiene en el navegador del jugador y no se sincroniza entre dispositivos.
- El historial visual y la memoria se envían al proxy, que prioriza el mensaje actual cuando existe una contradicción.
- El personaje sigue el tema que proponga el jugador y solo vuelve a los juegos cuando la conversación lo pide.
- El contexto se consulta para mensajes relacionados con política, economía, sociedad, negocios, ideas, inteligencia artificial, tendencias, farándula, lugares, eventos o recomendaciones; para otros temas la conversación conserva su tono de barrio sin forzar titulares.
- Si el jugador expresa un deseo, el personaje lo repite brevemente y responde con buenos deseos para que se cumpla, manteniéndolo como una ficción de homenaje sin prometer poderes reales.
- El reproductor reemplaza el control nativo gris por controles propios: play/pausa, progreso, volumen y estado visual de la señal.
- Las respuestas deben ser breves, no afirmar que el personaje es Chacalón real y evitar inventar citas o reproducir letras extensas.

## Ejecución local

```bash
copy .env.example .env.local
# Completar GEMINI_API_KEY en .env.local
npm run ai-server
npm start
```

La interfaz aparece directamente en `/chacalon/` como **Conversando con Chacalón Virtual**.
