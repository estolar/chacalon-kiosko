# Cannon Trainer

## Objetivo

Ajustar el ángulo de un cañón para alcanzar tres objetivos con un máximo de cinco intentos por objetivo.

## Arquitectura

```text
CannonTrainer.jsx
  ├── estado de partida
  ├── inputs controlados
  ├── historial
  └── GameShell
          ↓
cannonPhysics.js
  ├── clamp
  ├── computeRange
  └── evaluateShot
```

Es el juego más cercano al modelo React tradicional: la interfaz se deriva del estado y no necesita un bucle Canvas.

## Estado principal

- `targetIndex`: objetivo actual.
- `attempt`: intento actual.
- `hits`: impactos acumulados.
- `finished`: indica si terminó la partida.
- `angle`: valor de los inputs de ángulo.
- `shots`: historial de disparos.
- `banner`: mensaje y estilo de feedback.

## Inputs controlados

El slider y el input numérico utilizan el mismo estado:

```jsx
value={angle}
onChange={(event) => setAngle(...)}
```

Esto crea una única fuente de verdad para ambos controles.

## Física

El alcance se calcula con:

```text
R = A × sin(2θ)
```

La función `evaluateShot` compara el alcance obtenido con la distancia del objetivo y devuelve uno de tres resultados:

- `hit`.
- `short`.
- `long`.

Estas funciones son puras y se prueban sin renderizar React.

## Temporizadores

Después de un impacto o de agotar los intentos, se programa el siguiente objetivo. El temporizador se guarda en un `useRef` y se limpia al reiniciar o abandonar el juego.

## Ejercicios

1. Añadir viento que modifique el alcance.
2. Mostrar una trayectoria estimada.
3. Añadir diferentes tipos de proyectil.
4. Crear niveles con tolerancias distintas.
5. Guardar el mejor resultado.
