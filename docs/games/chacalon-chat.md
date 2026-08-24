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

## Estados principales

- `READY`: conversación lista para comenzar.
- La conversación comienza con un saludo que pide explícitamente el nombre; si no hay un nombre guardado, el primer mensaje se interpreta como el nombre del jugador.
- `CONNECTING`: solicitud en curso; se deshabilita el formulario.
- `ONLINE`: Gemini respondió correctamente.
- `OFFLINE`: Gemini no respondió y se muestra una respuesta local de respaldo.

## Decisiones de codificación

- La conversación se limita a 1200 caracteres por mensaje.
- Solo se envían los últimos ocho mensajes como contexto.
- El proxy aplica un límite local de 20 solicitudes por minuto.
- El fallback permite estudiar y probar la interfaz sin conexión.
- La interfaz divide el escenario en dos columnas de igual ancho: retrato arcade y conversación; en móvil se apilan.
- El personaje usa un tono peruano, criollo y barrial, con buenos deseos, sin afirmar que sea Chacalón real.
- Si le piden dinero, el personaje no promete prestarlo: responde con una ocurrencia recursera y buenos deseos.
- El nombre del jugador se guarda en `localStorage` y puede actualizarse varias veces durante la conversación.
- La memoria local conserva hasta ocho respuestas recientes del jugador en `retro-games.chacalon.profile`; sirve como contexto breve y no como una base de datos permanente.
- El historial visual y la memoria se envían al proxy, que prioriza el mensaje actual cuando existe una contradicción.
- El personaje sigue el tema que proponga el jugador y solo vuelve a los juegos cuando la conversación lo pide.
- Si el jugador expresa un deseo, el personaje lo repite brevemente y responde con buenos deseos para que se cumpla, manteniéndolo como una ficción de homenaje sin prometer poderes reales.
- Las respuestas deben ser breves, no afirmar que el personaje es Chacalón real y evitar inventar citas o reproducir letras extensas.

## Ejecución local

```bash
copy .env.example .env.local
# Completar GEMINI_API_KEY en .env.local
npm run ai-server
npm start
```

La interfaz aparece en el menú principal como **Conversando con Chacalón Virtual**.
