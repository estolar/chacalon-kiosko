# Conversando con Chacalón Virtual

## Propósito

Esta experiencia añade un personaje conversacional al arcade. Es un homenaje interactivo inspirado respetuosamente en Chacalón; no pretende ser la persona real ni generar una identidad auténtica.

## Arquitectura

```text
ChacalonChat.jsx
    │
    │ POST /api/ai/chat
    ▼
server/aiProxy.js
    │
    │ Gemini API
    ▼
Respuesta del modelo
```

React mantiene el historial visual, el estado de conexión y el formulario. El servidor local recibe el mensaje, limita el tamaño del historial, añade las instrucciones de personaje y llama a Gemini. La API key solo se lee desde `.env.local` en el servidor.

## Estados principales

- `READY`: conversación lista para comenzar.
- La conversación comienza de inmediato; si no hay un nombre guardado, el primer mensaje se interpreta como el nombre del jugador.
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
- El nombre del jugador se guarda en `localStorage` para reconocerlo en futuras visitas desde el mismo navegador.
- Las respuestas deben ser breves, no afirmar que el personaje es Chacalón real y evitar inventar citas o reproducir letras extensas.

## Ejecución local

```bash
copy .env.example .env.local
# Completar GEMINI_API_KEY en .env.local
npm run ai-server
npm start
```

La interfaz aparece en el menú principal como **Conversando con Chacalón Virtual**.
