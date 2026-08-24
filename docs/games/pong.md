# Pong

## Objetivo

Devolver la pelota y conseguir siete puntos antes que el rival.

## Controles

- Jugador 1: `W` y `S`.
- Jugador 2: `↑` y `↓`.
- `Espacio`: iniciar.
- `P`: pausar.
- `R`: reiniciar.

## Arquitectura

```text
Pong.jsx
  ├── marcador React
  ├── botones
  └── canvasRef
          ↓
pongEngine.js
  ├── PongEngine
  ├── Paddle
  └── Ball
          ↓
pongPhysics.js
  ├── clamp
  ├── paddleHit
  └── bounceVelocity
```

## Entidades

### `Paddle`

Representa una paleta. Guarda posición, tamaño y velocidad, y ofrece `update` y `draw`.

### `Ball`

Representa la pelota. Guarda posición, radio y velocidad, y puede reiniciar su trayectoria.

### `PongEngine`

Coordina teclado, fases, marcador, actualización, colisiones y renderizado.

## Rebotes

El ángulo depende de dónde golpea la pelota a la paleta:

```text
parte superior → rebote hacia arriba
centro         → rebote recto
parte inferior → rebote hacia abajo
```

`bounceVelocity` calcula la nueva velocidad sin depender de React. `paddleHit` comprueba el solapamiento horizontal y vertical.

## Ciclo del juego

```text
leer W/S y flechas
  ↓
mover paletas
  ↓
mover pelota
  ↓
rebotar en paredes
  ↓
comprobar paletas
  ↓
actualizar marcador
  ↓
dibujar Canvas
```

## Ejercicios

1. Añadir un modo contra la máquina.
2. Aumentar la velocidad después de cada rebote.
3. Añadir efectos de sonido.
4. Crear una pantalla de selección de dificultad.
5. Guardar el marcador histórico.
