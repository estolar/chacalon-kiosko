# Guía de codificación

Estas reglas mantienen el proyecto sencillo para aprender y suficientemente ordenado para crecer.

## Componentes React

- Un componente debe tener una responsabilidad clara.
- Recibe datos mediante props y comunica acciones mediante callbacks.
- Los nombres de componentes utilizan PascalCase.
- Los nombres de funciones y estados utilizan camelCase.
- La interfaz común de un juego debe reutilizar `GameShell`.

## Estado

- El estado de React se reserva para información que debe verse en pantalla.
- El motor puede mantener datos mutables de alta frecuencia, como posiciones y velocidades.
- Las actualizaciones de estado deben utilizar el setter correspondiente.
- Las funciones puras no deben modificar arrays u objetos recibidos.

## Efectos y ciclo de vida

Todo `useEffect` que registre recursos debe limpiarlos:

- `setTimeout` y `setInterval`.
- `requestAnimationFrame`.
- Listeners de `window` o `document`.
- Contextos de audio.

La limpieza permite salir de un juego sin dejar procesos ejecutándose en segundo plano.

## Motores de juego

Un motor debe separar estas responsabilidades:

```text
input → update → collision → score/state → render
```

Las entidades deben guardar sus datos y ofrecer métodos pequeños como `update` y `draw`.

## Física y funciones puras

La física debe extraerse cuando pueda probarse sin navegador. Una función como `paddleHit` debe devolver un resultado a partir de sus argumentos, sin tocar React ni el Canvas.

## Tests

Cada juego debe tener tests para:

- Reglas de puntuación.
- Colisiones.
- Límites de movimiento.
- Fórmulas físicas.
- Interacciones importantes de la interfaz.

Los tests se ejecutan con:

```bash
npm test -- --watchAll=false --runInBand
```

## Accesibilidad

- Los botones deben tener texto visible.
- Los Canvas deben incluir `aria-label`.
- Los inputs deben tener etiquetas o `aria-label`.
- No se debe depender únicamente del color para comunicar un estado.
- El teclado debe ofrecer una alternativa a los controles visuales.

## Estilo y mantenimiento

- Preferir funciones pequeñas y nombres descriptivos.
- Evitar duplicar la estructura de los juegos.
- Mantener la lógica de física fuera del JSX.
- Documentar decisiones importantes, no cada línea evidente.
- Corregir warnings de ESLint antes de publicar.

## Flujo de trabajo

Cada mejora importante debe seguir este ciclo:

```text
idea → implementación → tests → build → prueba manual → commit → push
```

Los commits deben representar cambios comprensibles, por ejemplo:

- `Add Pong arcade game`
- `Refactor arcade engine and add real tests`
- `Document game architecture`
