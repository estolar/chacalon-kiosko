# Chacalón Virtual

Una experiencia conversacional retro construida con React: Chacalón Virtual, música chicha, visuales arcade, memoria local, actualidad y respuestas de Gemini mediante streaming. Este repositorio es independiente de `retro-games`.

## Probarlo en local

```bash
npm install
npm start
```

Después abre:

```text
http://localhost:3010/chacalon/
```

Si el puerto 3000 está ocupado, Create React App propondrá otro puerto. En ese caso utiliza la dirección que muestre la terminal.

## Probar la conversación con Chacalón Virtual

La experiencia conversacional usa un servidor local como proxy para que la clave de Gemini no llegue al navegador.

1. Copia `.env.example` como `.env.local`.
2. Completa `GEMINI_API_KEY` con la clave creada en Google AI Studio.
3. En una terminal, ejecuta el proxy:

   ```bash
   npm run ai-server
   ```

4. En otra terminal, ejecuta la aplicación:

   ```bash
   npm start
   ```

El servidor de IA queda disponible en `http://localhost:3002`. La ruta `GET /api/health` permite comprobar si detectó la clave, sin mostrarla.

Si Gemini no está disponible, el chat utiliza respuestas locales de respaldo para que la interfaz siga siendo navegable.

### Actualidad y recomendaciones sin coste adicional

El chat puede recibir contexto de actualidad mediante un JSON generado por GitHub Actions a partir de feeds RSS públicos: política peruana, economía, sociedad, negocios, ideas, IA, tendencias, farándula y cultura. No requiere una instancia Node.js en Freehostia ni una llamada de búsqueda por cada mensaje.

- `scripts/update-context.js` genera `public/data/context.json`.
- `.github/workflows/update-context.yml` lo actualiza cada hora y permite ejecución manual.
- `data/recommendations.json` contiene únicamente lugares reales que hayamos verificado.
- El chat usa ese contexto solo cuando el mensaje habla de actualidad, lugares, eventos o recomendaciones.

Para que la versión publicada lea el archivo actualizado de GitHub, compila con:

```powershell
$env:REACT_APP_CONTEXT_URL="https://raw.githubusercontent.com/estolar/retro-games-streaming/main/public/data/context.json"
```

La explicación de la arquitectura y del flujo está en [Conversando con Chacalón Virtual](docs/games/chacalon-chat.md).

La experiencia incluye temporalmente `public/audio/caballito-pixelado-45s-test.mp3` como pista de prueba. Se reproduce manualmente desde el control del navegador y está marcada como material provisional hasta confirmar sus condiciones de uso.

### Preparar el despliegue gratuito en Freehostia Lovebeat

No necesitamos contratar la instancia Node.js. El Node (`server/aiProxy.js`) queda para desarrollo local y el hosting usa el endpoint PHP de `server-php/`.

1. Genera el frontend con `npm run build` y sube el contenido de `build/` a la carpeta pública de `/chacalon/`.
2. Sube `server-php/api/ai/chat.php` a `/chacalon/api/ai/chat.php`.
3. Copia `server-php/api/config/gemini.php.example` como `api/config/gemini.php` en el hosting y completa allí `apiKey`. Ese archivo está excluido de Git y protegido por `.htaccess`.
4. Antes de compilar para producción, configura la ruta PHP:

   ```powershell
   $env:REACT_APP_AI_API_PATH="/chacalon/api/ai/chat.php"
   npm run build
   ```

La API key nunca debe estar en una variable `REACT_APP_*`, porque esas variables quedan incorporadas en el JavaScript público.

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

### Breakout

Juego para un jugador basado en Canvas.

Practica:

- Paleta, pelota y bloques como entidades.
- Colisiones círculo-rectángulo.
- Vidas, puntuación y condición de victoria.
- Fases `menu`, `serve`, `play`, `paused`, `win` y `over`.

Controles: flechas izquierda/derecha para mover, espacio para iniciar, `P` para pausar y `R` para reiniciar.

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
│   ├── Breakout.jsx              # Interfaz React de Breakout
│   ├── breakoutPhysics.js        # Colisiones de Breakout
│   ├── breakoutEngine.js         # Motor Canvas de Breakout
│   ├── SpaceInvaders.jsx         # Interfaz React de Space Invaders
│   ├── spaceInvadersEngine.js    # Motor Canvas independiente
│   ├── ChacalonChat.jsx           # Interfaz del personaje conversacional
│   └── ChacalonChat.test.js       # Pruebas de conversación y fallback
├── server/
│   └── aiProxy.js                 # Proxy local para Gemini API
├── pages/NotFound404.jsx         # Pantalla 404 arcade
└── styles/retro.css              # Tema visual, CRT y responsive
```

La IA se consulta en eventos discretos de conversación; no participa en el bucle de animación de Canvas. Esto mantiene los juegos deterministas y permite reutilizar el mismo proxy para futuros NPCs, misiones y evaluaciones de partidas.

## Flujo de la aplicación

```text
BOOT → MENU → GAME
           ├── Space Invaders
           └── Cannon Trainer
```

La aplicación se publica bajo `/chacalon`, configurado en `package.json`, en el `basename` de `BrowserRouter` y en `public/.htaccess`. El arcade original continúa publicándose bajo `/retro-games/` desde su propio repositorio.

## Documentación técnica

La documentación se mantiene junto al código para convertir cada juego en una unidad de aprendizaje:

- [Arquitectura general](docs/architecture.md)
- [Guía de codificación](docs/coding-guidelines.md)
- [Space Invaders](docs/games/space-invaders.md)
- [Cannon Trainer](docs/games/cannon-trainer.md)
- [Pong](docs/games/pong.md)
- [Breakout](docs/games/breakout.md)

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
