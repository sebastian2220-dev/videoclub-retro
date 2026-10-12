# Plan maestro — Entrada profesional

## Objetivo
Construir una única escena de entrada con calidad final antes de avanzar al Hall. La escena debe sentirse viva, coherente y pulida: personaje con idle natural, neones dinámicos, cartel ABIERTO animado, botón ENTRAR independiente con respuesta 3D, iluminación ambiental y sonido.

## Principio de trabajo
No animaremos una imagen plana. Separaremos la composición en capas independientes para que cada elemento pueda moverse, brillar o reaccionar sin deformar el resto de la escena.

## Capas definitivas
1. `entrada_fondo.webp`
   - Fachada, puertas, estantes, posters, calle y piso.
   - Sin mujer.
   - Sin alfombra/botón ENTRAR.
   - Sin glow fuerte del letrero principal.
   - Sin cartel ABIERTO si queremos animarlo por separado.

2. `mujer_idle.webp`
   - Mujer completa con fondo transparente.
   - Posición y perspectiva idénticas al arte original.

3. `mujer_blink.webp`
   - Misma mujer y encuadre, pero con ojos cerrados.
   - Debe coincidir exactamente con `mujer_idle.webp` para poder intercambiar texturas sin saltos.

4. `neon_logo_base.webp`
   - Letras y tubos del letrero VIDEOCLUB RETRO con fondo transparente.

5. `neon_logo_glow.webp`
   - Halo luminoso suave del mismo letrero.
   - Más difuso que la capa base.
   - Se animará con alpha y pequeñas variaciones de intensidad.

6. `cartel_abierto.webp`
   - Cartel ABIERTO aislado con transparencia.
   - Se animará con balanceo muy leve.

7. `boton_entrar.webp`
   - Botón/alfombra independiente de alta calidad.
   - Sin fondo.
   - Se animará al pasar el mouse y al hacer clic.

8. Capas opcionales de polish
   - `luces_marquesina.webp`: focos/ampolletas separadas.
   - `reflejo_vidrio.webp`: reflejo tenue sobre puertas y vitrinas.
   - `glow_interior.webp`: iluminación cálida del interior.

## Animaciones objetivo

### Mujer
- Respiración visual: desplazamiento vertical de 2–4 px y escala máxima de 1–1.5%.
- Duración aproximada: 1.6–2.2 s por ciclo.
- Pestañeo aleatorio cada 2.8–5.5 s.
- Duración del pestañeo: 90–140 ms.
- Sin movimientos bruscos ni loop evidente.
- Fase posterior opcional: pelo o mano con movimiento independiente.

### Neón VIDEOCLUB RETRO
- Glow base continuo.
- Pulsación suave y lenta entre 82% y 100% de intensidad.
- Flicker irregular ocasional, no constante.
- Microfallo raro de una barra/tubo durante 80–180 ms.
- Evitar efecto discoteca: el movimiento debe sentirse eléctrico y ambiental.

### Cartel ABIERTO
- Rotación máxima aproximada de ±1.2°.
- Movimiento lento de 2.5–4 s.
- Ease sinusoidal.
- Ningún rebote caricaturesco.

### Botón ENTRAR
- Hover: +4–6% de escala.
- Subida de 6–10 px.
- Duración: 120–170 ms.
- Clic: compresión breve de 1–2% y recuperación.
- Sin overlays amarillos ni cambios de color toscos.

### Iluminación ambiental
- Glow interior cálido con variación casi imperceptible.
- Focos de marquesina con pequeños cambios de intensidad y ligeros desfases.
- Reflejo de vidrio con alpha muy bajo para dar profundidad.

## Audio
- Ambiente nocturno muy suave.
- Zumbido de neón sutil.
- Hover corto para ENTRAR.
- Click suave del botón.
- Campanilla de puerta al entrar al Hall.

Los sonidos deben poder desactivarse globalmente más adelante.

## Orden correcto de implementación

### Fase 1 — Arte limpio
Crear y validar todas las capas principales. No escribir animaciones definitivas hasta que el fondo y los PNG/WebP transparentes estén bien alineados.

Criterio de aprobación: al recomponer todas las capas sin animación, la escena debe verse igual o mejor que la imagen original y no deben existir bordes, duplicados o huecos.

### Fase 2 — Mujer
Agregar respiración y pestañeo. Revisar que el personaje no parezca flotar ni deformarse.

### Fase 3 — Neón
Agregar base + glow + flicker irregular. Ajustar hasta que parezca iluminación de local y no un efecto de interfaz.

### Fase 4 — Cartel y luces
Agregar balanceo de ABIERTO, marquesina y reflejos.

### Fase 5 — ENTRAR
Alinear el botón independiente con el piso. Agregar hover/click 3D.

### Fase 6 — Sonido y transición
Agregar ambiente, neon hum, hover/click y campanilla. Después crear una transición limpia al Hall.

### Fase 7 — QA visual
Ejecutar captura automática a 1920×1080 en GitHub Actions y revisar:
- alineación de capas;
- artefactos de transparencia;
- movimiento demasiado fuerte;
- elementos duplicados;
- clipping;
- errores de consola;
- comportamiento en hover y click.

No se avanza al Hall hasta aprobar esta fase.

## Arquitectura Phaser propuesta
La escena `EntradaScene` tendrá grupos lógicos:
- `backgroundLayer`
- `ambientLightLayer`
- `characterLayer`
- `signLayer`
- `interactionLayer`
- `fxLayer`

Cada capa tendrá su propia profundidad (`depth`) para mantener el orden visual estable.

## Estándar de calidad
La Entrada se considera terminada solo cuando:
- puede quedarse en pantalla 20–30 segundos y seguir sintiéndose viva;
- ninguna animación distrae;
- el personaje no se ve como una imagen pegada;
- el neón tiene profundidad luminosa;
- ENTRAR responde como un botón de videojuego premium;
- el conjunto mantiene el estilo cartoon HD original;
- no hay errores en consola;
- la captura automática a 1920×1080 se ve limpia.

## Regla de proyecto
Hasta que esta escena no esté aprobada visualmente, no se desarrollarán nuevas escenas ni sistemas de economía, colección, alquiler o trivia.
