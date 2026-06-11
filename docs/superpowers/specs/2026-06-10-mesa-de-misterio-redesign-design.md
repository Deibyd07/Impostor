# Mesa de Misterio — Rediseño visual «Lámpara y Tinta»

Fecha: 2026-06-10 · Alcance: cliente web (React/Vite/Tailwind). La lógica de juego, sockets, voz, votaciones, perfiles y ranking no se tocan.

## 1 · Diagnóstico del estado actual

Problemas reales observados en el código:

1. **Desktop = móvil estirado.** `.phone-screen-center { flex: 0 0 500px }` clava una columna de teléfono en el centro con dos raíles de 300px. En un monitor 1920px sobran ~800px de fondo vacío. Es la causa nº1 de "parece web, no juego".
2. **Paleta SaaS oscura.** Fondos azul-negro fríos (#07070f), texto slate (#f1f5f9/#94a3b8), acentos Tailwind (amber-500, red-600, blue-500). Es la paleta de cualquier dashboard dark. No hay materia: ni papel, ni tinta, ni madera, ni luz de lámpara.
3. **Tipografía genérica.** Inter (la fuente del "AI slop"), Cinzel (dice "hotel de lujo romano", no "expediente policial") y Bebas. Cero voz tipográfica de novela negra.
4. **Todo es la misma card.** ~40 variantes de "rectángulo redondeado oscuro con borde 1px y glow". Cartas, paneles, mapas y botones comparten el mismo material; nada se siente pieza de juego.
5. **El Detective no tiene escritorio.** En Coartada, el Detective ve el mismo layout que un sospechoso con otro sidebar. No hay sensación de autoridad ni de tablero de investigación.
6. **El mapa no parece plano.** Rectángulos CSS con líneas SVG finas grises. No comunica "plano del edificio": sin muros, sin puertas, sin escena del crimen dramatizada.
7. **Estilos inline masivos** en componentes (RoleCard, ChatBox, DetectiveInterrogationPanel, VotePrivate…) que impiden tematizar y duplican el CSS de 6.000 líneas.
8. **Jerarquía plana en pantallas largas** (AlibiCaseIntro, Discussion): 6-8 paneles idénticos apilados; el ojo no sabe dónde empezar.

## 2 · Dirección visual: «Lámpara y Tinta» (noir de mesa, cartoon premium)

**Concepto:** cada pantalla es **el escritorio de un detective de noche**, iluminado por una lámpara cálida. La UI no son "cards": son **objetos** sobre la mesa — carpetas manila, hojas escritas a máquina, polaroids con cinta adhesiva, sellos de goma, hilo rojo con alfileres, etiquetas de evidencia. Cartoon premium = formas rotundas, rotaciones sutiles (±1.5°), sellos exagerados, sombras duras tipo tablero; nunca foto-realismo.

**El movimiento clave:** introducir superficies de **papel claro con tinta oscura** sobre el escritorio oscuro. Hoy todo es oscuro-sobre-oscuro; el contraste papel/escritorio es lo que convierte "web dark" en "juego de mesa".

### Paleta (mismos nombres de variable, valores nuevos → re-tematiza las 6.000 líneas existentes)
- Escritorio: `--bg-base #150e11`, `--bg-deeper #0c0709`, superficies cuero `#221619 / #2b1c20 / #362329`.
- **Papel (nuevo):** `--paper #f0e3c8`, `--paper-2 #e7d2a8` (manila), `--paper-3 #d9bf8e` (avejentado); tinta `--ink #2a1d18`, `--ink-2 #5c4636`, `--ink-3 #8a6f55`.
- Rojo crimen `--impostor #cf3b34`, latón detective `--gold #d6a450`, azul policial desvaído `--citizen #5e8aa6`, verde sello `--victory #5a9e6b`, hilo `--thread #d23b2e`.
- Texto sobre oscuro: crema cálido `#f3e8d2 / #c3ab8c / #937c63` (adiós slate frío).

### Tipografías (Google Fonts, 3 familias)
- **Display: Fraunces** (400–900 + itálica) — serif entintada con carácter vintage; en pesos altos da el punch cartoon-premium.
- **Máquina: Special Elite** — etiquetas, sellos, códigos de sala, metadatos, evidencia. Vende "expediente" al instante.
- **UI: Familjen Grotesk** (400–700) — cuerpo y controles, legible y con personalidad. Inter/Cinzel/Bebas se eliminan.

### Librería de props (CSS puro en tokens.css)
`.paper` (+ `--manila`, `--aged`, `--dark`), `.tape` (cinta adhesiva), `.stamp` (sello de goma rojo/latón/verde, rotado), `.polaroid` (foto de jugador), `.folder-tab` (pestaña de carpeta), `.evidence-tag` (etiqueta con cordel), `.pin` + `.thread` (alfiler e hilo rojo), `.typewriter`, tilts `.tilt-1/2/-1/-2`, fondo `.app-shell` = mesa con lámpara (radial cálido + viñeta + grano).

### Botones
- **Primario = sello/placa:** slab rojo crimen con sombra dura desplazada (cartoon) y press físico (translateY).
- **Secundario = etiqueta manila:** papel con borde punteado (cosido) y tinta.
- **Ghost = nota a lápiz:** texto tinta con subrayado.

### Sistema de layout (desktop primero)
- Página fija a 100vh: el centro y los raíles scrollean internamente (nunca scroll de página). 
- ≥1024px: `phone-screen` = flex centrado `raíl 300–360px | centro flexible (max --center-max, por defecto 1080px; pantallas de carta 720px; tablero Coartada 1180px) | raíl 300–380px`, gap 24px, sobre la mesa completa. Los raíles son objetos (carpeta/portapapeles), no columnas con borde.
- <1024px: una columna, mismos objetos apilados, footer pegajoso; nada se corta, scroll interno en chat/listas.
- API de `PhoneScreen` intacta (children/leftPanel/rightPanel/footer) — solo cambia su piel y se le añaden modificadores `has-left/has-right`.

### Composiciones clave por pantalla
1. **Home:** mesa con expediente abierto al centro (carpeta manila MS-01 con cinta, sello "MESA ABIERTA", título Fraunces gigante), modos como dos cartas de juego a la izquierda, portapapeles "procedimiento" a la derecha, hilo rojo conectando props.
2. **Crear/Unirse:** "ficha de registro" en papel (formulario máquina de escribir) + placa de agente.
3. **Lobby:** código de sala como etiqueta de evidencia gigante; jugadores = polaroids con cinta y nombre rotulado; QR pegado como foto; config del host = carpeta con pestañas.
4. **Revelación:** carta física que se voltea — dorso "CONFIDENCIAL" sellado; cara = papel con rol. Coartada: hoja mecanografiada con ubicación enorme, "VISTE/OÍSTE/DETALLE" como anotaciones, riesgo como nota al margen en rojo.
5. **Discusión Impostor:** tablero central con orador destacado (spotlight), expediente propio como carpeta a la izquierda, chat como "transcripción" a la derecha.
6. **Discusión Coartada (showcase):**
   - **Detective:** "escritorio del detective" distinto: cabecera con placa, muro de sospechosos en polaroids conectadas con hilo rojo al mapa, botonera de interrogatorio/acusación como sellos. Más denso, más poderoso.
   - **Sospechoso:** su coartada como carta privada clara (ubicación, versión, qué vio/oyó, pista, riesgo) + mesa pública.
7. **Mapa del caso:** plano sobre papel avejentado: habitaciones con muros de tinta y trama de rayado, pasillos punteados, puertas como huecos, escena del crimen con contorno de tiza + X roja, zona seleccionada con alfiler e hilo. Leyenda de plano. Lógica de zonas/rutas existente intacta.
8. **Votación/Acusación:** pliego "LA ACUSACIÓN"; cada sospechoso es una polaroid que al votar recibe el sello CULPABLE.
9. **Resultado de ronda:** informe mecanografiado con sello VERDADERO/FALSO gigante en diagonal; puntos como tabla de informe.
10. **Final:** portada de expediente "CASO CERRADO" con sello y ranking como informe firmado.
11. **Chat:** hoja de transcripción (papel oscuro) con líneas mecanografiadas; voz = panel "radio" con vúmetro.
12. **Perfil/Ranking/Notas:** heredan tokens + retoques (carpeta de personal, tablón de rankings, notas de parche como telegrama).

### Motion
Framer-motion ya está instalado (sin dependencias nuevas). Reglas: una animación protagonista por pantalla (volteo de carta, golpe de sello, hilo que se dibuja), microinteracciones CSS (press de botón, polaroid que se endereza al hover), `prefers-reduced-motion` respetado.

### Accesibilidad
Contraste AA en papel (tinta #2a1d18 sobre #f0e3c8 ≈ 9:1) y sobre escritorio (crema sobre #150e11). Focus visible: anillo latón 2px + offset. Tamaños mínimos 13px UI / 44px targets táctiles. Scroll interno con scrollbars finos visibles en desktop.

## 3 · Plan de implementación
1. **Fundación:** index.html (fonts/título), tokens.css (rewrite completo), base+shell de index.css, tailwind.config.
2. Home → 3. Lobby/Join/Waiting/Config → 4. Revelación (MyCard/RoleCard/AlibiCard/CaseIntro) → 5. Discusión ambos modos + Detective + Mapa + Chat/Voz → 6. Votación/Resultados/Final → 7. Secundarias + responsive + a11y → 8. `npm run build` + guía de prueba.

Riesgos controlados: nombres de clase y de variables existentes se conservan (se re-estilizan); los estilos inline que bloquean el tema se migran a clases sin tocar lógica/props; cada fase deja la app compilando.
