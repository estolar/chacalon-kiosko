# Arquitectura de Chacalón Virtual

## Objetivo

Chacalón Virtual es una aplicación independiente del arcade `retro-games`. Combina una interfaz React, un reproductor visual y un proxy para conversar con Gemini.

## Flujo principal

```text
index.js
  ↓ BrowserRouter (basename: /chacalon)
App.jsx
  ├── /       → ChacalonStandaloneApp
  │              ↓
  │       ChacalonChat
  └── *       → NotFound404
```

`ChacalonStandaloneApp` presenta directamente la experiencia conversacional. El botón de salida lleva al arcade original en `/retro-games/`.

## Capas del proyecto

### 1. Presentación React

Incluye `BootScreen`, `GameMenu`, `TopBar`, `GameShell` y los componentes de cada juego.

Responsabilidades:

- Renderizar la interfaz.
- Mostrar el HUD.
- Recibir acciones del usuario.
- Gestionar estados visibles.
- Comunicar eventos al motor.

### 2. Motor del juego

El visualizador de música utiliza Canvas y Web Audio:

El elemento `<audio>` alimenta un `AnalyserNode`; un bucle `requestAnimationFrame`
dibuja barras, ondas, anillos y scanlines sin depender de Gemini.

### 3. Conversación e IA

`ChacalonChat.jsx` envía el mensaje, el historial, la memoria local y el contexto
diario a `server/aiProxy.js` durante el desarrollo. En producción, `chat.php` cumple
la misma función para el hosting.

La respuesta de Gemini se retransmite mediante SSE para mostrarla progresivamente.

### 4. Estilos

`styles/retro.css` define:

- Variables de color.
- Tipografías pixel.
- Paneles y botones.
- Efectos CRT.
- Responsive layout.
- Animaciones CSS.

## Patrón de integración React + Canvas

```text
Componente React
  ├── useRef → referencia al canvas
  ├── useEffect → crea y destruye el motor
  ├── useState → HUD y controles visibles
  └── callbacks → motor → React
```

El `useEffect` debe limpiar siempre el motor, el `requestAnimationFrame` y los listeners globales cuando el juego sale de pantalla.

## Máquina de estados de un juego

Los motores actuales utilizan fases similares:

```text
menu → play ⇄ paused
          ↓
         over
```

Esta máquina evita que el juego se actualice cuando está pausado o terminado.

## Cómo añadir un juego

1. Crear el componente de interfaz en `src/games/`.
2. Crear un motor independiente si utiliza Canvas.
3. Extraer la física a funciones puras cuando sea posible.
4. Usar `GameShell` para la estructura común.
5. Añadir los metadatos a `src/data/games.js`.
6. Registrar el componente en `ArcadeApp.jsx`.
7. Crear tests para las reglas principales.
8. Documentar el juego en `docs/games/`.

## Despliegue

`package.json` define `homepage: "/chacalon"`, `index.js` utiliza el mismo valor como
`basename` y `public/.htaccess` permite resolver las rutas internas en Apache.
