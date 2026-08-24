# Breakout

## Objetivo

Destruir todos los bloques con una pelota antes de perder las tres vidas.

## Controles

- `←` y `→`: mover la paleta.
- `Espacio`: iniciar o continuar.
- `P`: pausar.
- `R`: reiniciar.

## Arquitectura

```text
Breakout.jsx
  ├── marcador React
  ├── botones y controles
  └── canvasRef
          ↓
breakoutEngine.js
  ├── BreakoutEngine
  ├── BreakoutPaddle
  ├── BreakoutBall
  └── Brick
          ↓
breakoutPhysics.js
  ├── clamp
  ├── circleRectOverlap
  └── bounceFromPaddle
```

## Estado de la partida

```text
menu → play ⇄ paused
  ↓       ↓
serve   win / over
```

`serve` representa el momento posterior a perder una vida: la pelota espera a que el jugador pulse espacio.

## Física

La pelota se mueve con velocidad horizontal y vertical. Rebota en las paredes laterales y superior. Cuando toca la paleta, el ángulo depende del punto de impacto:

- Cerca del centro: rebote casi vertical.
- Cerca de un extremo: rebote más diagonal.

Los bloques se modelan como rectángulos. `circleRectOverlap` comprueba el contacto entre la pelota circular y cada bloque.

## Puntuación y vidas

Los bloques superiores dan más puntos. Al destruir todos los bloques, la partida entra en `win`. Si la pelota cae tres veces, entra en `over`.

## Ejercicios

1. Añadir bloques que necesiten dos impactos.
2. Crear bloques indestructibles.
3. Añadir power-ups para agrandar la paleta.
4. Acelerar la pelota cada diez bloques.
5. Crear un segundo nivel con otra distribución.
