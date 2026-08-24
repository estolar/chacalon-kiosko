# Space Invaders

## Objetivo

Eliminar oleadas de invasores antes de perder las tres vidas.

## Controles

- `←` y `→`: mover la nave.
- `Espacio`: iniciar y disparar.
- `P`: pausar o reanudar.
- `R`: reiniciar.

## Arquitectura

```text
SpaceInvaders.jsx
  ├── HUD React: puntos, vidas, nivel y mensaje
  ├── botones de control
  └── canvasRef
          ↓
spaceInvadersEngine.js
  ├── SpaceInvadersEngine
  ├── Player
  ├── Invader
  ├── Shot
  ├── Particle
  └── AudioSystem
```

## Papel de React

El componente React no actualiza cada píxel. Mantiene el HUD y crea el motor dentro de un `useEffect`.

```jsx
const canvasRef = useRef(null);
const [hud, setHud] = useState(...);

useEffect(() => {
  const engine = new SpaceInvadersEngine({ canvas, onHUD, onMessage });
  engine.mount();
  return () => engine.destroy();
}, []);
```

`useRef` conserva referencias que no deben provocar renderizados. `useState` se utiliza para los datos que sí debe mostrar React.

## Programación orientada a objetos

Cada entidad tiene datos y comportamiento:

- `Player`: posición, velocidad y cadencia de disparo.
- `Invader`: posición, fila y estado vivo.
- `Shot`: posición, velocidad y actividad.
- `Particle`: posición, velocidad, color y tiempo de vida.
- `SpaceInvadersEngine`: coordina la simulación.

## Ciclo del juego

Cada frame sigue esta secuencia:

```text
leer teclado
  ↓
actualizar jugador, disparos y partículas
  ↓
mover invasores
  ↓
crear disparos enemigos
  ↓
comprobar colisiones
  ↓
actualizar HUD y fase
  ↓
dibujar Canvas
```

El delta time hace que el movimiento dependa del tiempo transcurrido y no del número de frames.

## Sonido

`AudioSystem` utiliza Web Audio API para generar sonidos simples con osciladores. El estado de silencio se comparte mediante un `useRef`, de modo que activar o desactivar el sonido no reinicia el juego.

## Ejercicios

1. Añadir un tipo de invasor con más resistencia.
2. Crear un escudo destructible.
3. Añadir una nave de bonificación.
4. Registrar la puntuación máxima en `localStorage`.
5. Crear una prueba para la puntuación por fila.
