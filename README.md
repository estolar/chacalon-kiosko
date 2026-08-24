# Retro Games

Una colección de juegos arcade construida con React. El proyecto funciona como laboratorio para practicar desarrollo de interfaces, programación orientada a objetos, Canvas, animación, física sencilla y diseño de videojuegos.

## Probarlo en local

```bash
npm install
npm start
```

Después abre:

```text
http://localhost:3000/retro-games/
```

Si el puerto 3000 está ocupado, Create React App propondrá otro puerto. En ese caso utiliza la dirección que muestre la terminal.

## Comandos útiles

```bash
# Servidor de desarrollo
npm start

# Pruebas automáticas
npm test -- --watchAll=false --runInBand

# Compilación de producción
npm run build
```

## Juegos disponibles

### Space Invaders

Juego basado en Canvas y un motor de juego independiente de React.

Practica:

- `requestAnimationFrame` y delta time.
- Entidades y clases: `Player`, `Invader`, `Shot` y `Particle`.
- Movimiento, disparos y colisiones.
- Partículas y efectos de sonido con Web Audio.
- Eventos globales de teclado.
- Comunicación entre un motor imperativo y un HUD construido con React.

Controles: flechas izquierda y derecha para mover, espacio para disparar, `P` para pausar y `R` para reiniciar.

### Cannon Trainer

Juego construido principalmente con componentes y estado de React.

Practica:

- Inputs controlados.
- Validación de valores.
- Funciones puras para la lógica física.
- Cálculo del alcance mediante `R = A × sin(2θ)`.
- Historial de disparos.
- Mensajes de éxito, advertencia y derrota.

Control: ajusta el ángulo y pulsa `DISPARAR` o `Enter`.

### Pong

Juego para dos jugadores basado en Canvas.

Practica:

- Movimiento de paletas.
- Rebotes y ángulos según el punto de impacto.
- Marcador y condición de victoria.
- Clases `Paddle`, `Ball` y `PongEngine`.
- Separación entre física, motor e interfaz.

Controles: `W/S` para el jugador 1, flechas arriba/abajo para el jugador 2, espacio para iniciar, `P` para pausar y `R` para reiniciar.

## Arquitectura

```text
src/
├── index.js                      # Entrada de React y BrowserRouter
├── App.jsx                       # Rutas principales
├── ArcadeApp.jsx                 # Máquina de estados del arcade
├── data/games.js                 # Catálogo de juegos
├── components/
│   ├── BootScreen.jsx            # Pantalla de inicio
│   ├── ArcadeShowcase.jsx        # Animación visual de portada
│   ├── GameMenu.jsx              # Selección de juegos
│   ├── GameShell.jsx             # Plantilla reutilizable para juegos
│   └── TopBar.jsx                # Barra de navegación del arcade
├── games/
│   ├── CannonTrainer.jsx         # Interfaz React del cañón
│   ├── cannonPhysics.js          # Lógica física reutilizable
│   ├── Pong.jsx                  # Interfaz React de Pong
│   ├── pongPhysics.js            # Rebotes y colisiones de Pong
│   ├── pongEngine.js             # Motor Canvas de Pong
│   ├── SpaceInvaders.jsx         # Interfaz React de Space Invaders
│   └── spaceInvadersEngine.js    # Motor Canvas independiente
├── pages/NotFound404.jsx         # Pantalla 404 arcade
└── styles/retro.css              # Tema visual, CRT y responsive
```

## Flujo de la aplicación

```text
BOOT → MENU → GAME
           ├── Space Invaders
           └── Cannon Trainer
```

La aplicación se publica bajo `/retro-games`, configurado en `package.json` y en el `basename` de `BrowserRouter`.

## Crear un juego nuevo

1. Crea un componente dentro de `src/games/`.
2. Utiliza `GameShell` para conservar el encabezado, los botones y los controles comunes.
3. Añade la información del juego en `src/data/games.js`.
4. Registra el componente en `ArcadeApp.jsx`.
5. Añade una prueba para la lógica principal del juego.

La plantilla `GameShell` permite concentrarse en la mecánica de cada juego sin repetir la estructura visual del arcade.

## Objetivo didáctico

Este repositorio está pensado para avanzar por capas:

1. Componentes, props y eventos.
2. Estado y renderizado condicional.
3. Inputs controlados y validación.
4. Efectos, temporizadores y limpieza.
5. Programación orientada a objetos para entidades del juego.
6. Canvas, bucles de animación y colisiones.
7. Pruebas automáticas y accesibilidad.
8. Arquitectura para añadir nuevos juegos.

## Tecnologías

- React 19.
- React Router.
- Create React App.
- Canvas 2D.
- Web Audio API.
- CSS, animaciones y tipografías pixel.
- Jest y React Testing Library.

Proyecto desarrollado por Enrique Stolar para practicar y enseñar Desarrollo de Interfaces.
