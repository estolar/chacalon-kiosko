# Arquitectura de Retro Games

## Objetivo

Retro Games está organizado como un laboratorio de interfaces y videojuegos. La aplicación combina componentes React para la interfaz con pequeños motores imperativos para los juegos que utilizan Canvas.

## Flujo principal

```text
index.js
  ↓ BrowserRouter (basename: /retro-games)
App.jsx
  ├── /       → ArcadeApp
  └── *       → NotFound404
              ↓
       boot → menu → game
                     ↓
          Space Invaders | Cannon Trainer | Pong
```

`ArcadeApp` mantiene el estado de navegación del arcade. El juego activo se identifica mediante `activeGameId` y cada juego recibe `onExit` para regresar al menú.

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

`spaceInvadersEngine.js` y `pongEngine.js` contienen la simulación del juego:

- Bucle `requestAnimationFrame`.
- Entrada de teclado.
- Actualización de entidades.
- Colisiones.
- Marcador y fases de partida.
- Renderizado en Canvas.

El motor no renderiza botones ni depende de componentes React. Envía cambios al HUD mediante callbacks como `onHUD` y `onMessage`.

### 3. Lógica pura

Las funciones de `cannonPhysics.js` y `pongPhysics.js` reciben datos y devuelven resultados sin modificar la interfaz.

Esto permite probar la física con tests rápidos y deterministas.

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

`package.json` define `homepage: "/retro-games"` y `index.js` utiliza el mismo valor como `basename`. Esto permite publicar el build en GitHub Pages dentro de esa subcarpeta.
