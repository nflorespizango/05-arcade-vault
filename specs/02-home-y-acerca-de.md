# SPEC 02 — Home (landing) y Acerca de

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-10-10
> **Objective:** Implementar en Next.js la landing de `references/templates/home-about/` como nuevo `/` y su página "Acerca de" con contacto en `/acerca`, moviendo la Biblioteca actual a `/biblioteca`.

---

## Por qué existe este spec

SPEC 01 dejó la Biblioteca como portada (`/`). La carpeta `references/templates/home-about/` define una portada distinta: una landing con hero, propuesta de valor, vista previa de juegos, estadísticas, actividad, precios y CTA final, más una página "Acerca de" con formulario de contacto. Adoptarla obliga a mover la Biblioteca a otra ruta y a actualizar todos los enlaces que hoy apuntan a `/`. Además, `app/globals.css` no contiene ninguna de las clases de esas secciones (`home-hero`, `feature-grid`, `about-hero`, `.reveal`, etc.), por lo que hay que portarlas desde la plantilla.

## Alcance

**Dentro:**

- Nueva landing en `/` con las secciones de `home.jsx`: hero (siluetas flotantes, título, subtítulo, dos CTA, indicador "DESLIZA"), `// 01` ¿POR QUÉ ARCADE VAULT? (4 tarjetas), `// 02` JUEGOS DISPONIBLES AHORA (6 mini-cards + "VER TODOS LOS JUEGOS"), bloque de estadísticas (3 cifras), `// 03` ACTIVIDAD EN VIVO (últimas puntuaciones + top jugadores de hoy), `// 04` PRECIOS (plan único + 3 preguntas frecuentes) y CTA final.
- Nueva página `/acerca` con las secciones de `about.jsx`: hero de misión con 3 destacados, divisor de píxeles y formulario de contacto (nombre, correo, mensaje) con validación visual (vibración si hay campos vacíos) y estado de éxito tipo terminal "VAULT-OS". El formulario no envía nada a ningún sitio.
- Mover la Biblioteca de `/` a `/biblioteca` sin cambiar su contenido.
- Actualizar `Nav` (escritorio y panel móvil) a cuatro enlaces: Inicio, Biblioteca, Salón de la Fama, Acerca de.
- Actualizar todos los enlaces internos que hoy apuntan a `/` con intención de "ir a la biblioteca" (ver plan, paso 3).
- Animación de aparición al hacer scroll (`.reveal`) mediante un componente cliente con `IntersectionObserver`.
- Portar a `app/globals.css` las clases de `references/templates/home-about/styles.css` que falten, con sus reglas responsive.
- Metadata: `<title>` "Arcade Vault · Portal Retro" en `/`, y títulos propios para `/biblioteca` y `/acerca`.
- Datos mock tipados para "últimas puntuaciones" y "top jugadores de hoy".

**Fuera de alcance (specs futuros):**

- Envío real del formulario de contacto (correo, API, base de datos, antispam).
- Actividad en vivo real, ranking global real o estadísticas reales. Las cifras y listas del Home son mock.
- Lógica de planes o pagos. La sección PRECIOS es solo texto.
- Ocultar los CTA "CREAR CUENTA" / "EMPEZAR GRATIS" cuando hay sesión. Se muestran siempre.
- 404 real con código HTTP 404 para `/juegos/no-existe` (sigue pendiente de SPEC 01).
- Cargar Press Start 2P como en la plantilla (ajuste opcional de SPEC 01 que no entra aquí).
- Cambios al Reproductor, Detalle, Acceso o Salón más allá de actualizar enlaces.
- Tests automatizados e internacionalización.

## Modelo de datos

Se añaden datos mock tipados en `lib/games.ts`. No hay datos nuevos en `localStorage` ni cambios en `Game`, `ScoreRow`, `av_user` o `av_scores`.

```ts
export interface ActivityRow {
  player: string; // p. ej. "NEONFOX"
  game: string; // título legible, p. ej. "Caída"
  score: number;
  ago: string; // ya formateado, p. ej. "hace 2 min"
  color: GameColor; // clase neon-{color} del nombre del jugador
}

export interface TopPlayer {
  rank: number;
  player: string;
  score: number;
}

export const RECENT_ACTIVITY: ActivityRow[]; // 7 filas, las de home.jsx
export const TOP_TODAY: TopPlayer[]; // 5 filas, las de home.jsx
```

Convenciones:

- Los números se formatean con `toLocaleString("es-ES")`, igual que en SPEC 01.
- El texto de las secciones (tarjetas "¿Por qué?", estadísticas, lista de precios, preguntas frecuentes, destacados de Acerca de) se copia tal cual de la plantilla y vive en los componentes de página. Es copy provisional de un MVP visual.
- Las mini-cards usan `GAMES.slice(0, 6)` de `lib/games.ts` y enlazan a `/juegos/[id]`.
- El ancho de las barras de "top jugadores" es `100 - índice * 16` por ciento, como en la plantilla.

## Rutas

| Ruta          | Pantalla                  | Tipo de componente                                                |
| ------------- | ------------------------- | ----------------------------------------------------------------- |
| `/`           | Home (landing)            | Server page; `Reveal` y siluetas como componentes auxiliares      |
| `/biblioteca` | Biblioteca (movida)       | Server page + `LibraryClient` existente, sin cambios de contenido |
| `/acerca`     | Acerca de + Contacto      | Server page + `ContactForm` client                                |

Antes de escribir código se deben releer las guías de `node_modules/next/dist/docs/` sobre `cacheComponents` y `metadata`, como exige `CLAUDE.md`.

## Plan de implementación

Cada paso deja la app ejecutable con `npm run dev`.

1. Leer las guías de Next.js relevantes (metadata y `cacheComponents`). Comparar `app/globals.css` con `references/templates/home-about/styles.css` y listar las clases ausentes (secciones de Home y de Acerca de, `.reveal`, `.mini-card`, `.terminal-success`, etc.).
2. Portar a `app/globals.css` las clases faltantes con su responsive, sin reescribirlas a utilidades Tailwind. `.reveal` solo oculta el contenido cuando el elemento lleva la clase `reveal-armed`, que añade el cliente tras montar; sin JavaScript o con `prefers-reduced-motion: reduce` el contenido queda visible. Verificación: la app compila y las pantallas existentes no cambian visualmente.
3. Mover la Biblioteca: crear `app/biblioteca/page.tsx` con el contenido actual de `app/page.tsx` y su `metadata` (título propio). Actualizar los enlaces que significan "ir a la biblioteca": `components/nav.tsx` (activo si `pathname.startsWith("/biblioteca")` o `/juegos`), `components/game-player.tsx` ("VOLVER AL VAULT"), `app/juegos/[id]/page.tsx` (botón de volver), `components/hall-of-fame-client.tsx` (enlace del estado vacío) y la redirección tras login/invitado en `components/auth-form.tsx`. `/` queda temporalmente sin contenido propio (placeholder mínimo que enlaza a `/biblioteca`). Prueba manual: `/biblioteca` muestra las 8 tarjetas y el flujo Detalle → Jugar → "VOLVER AL VAULT" cae en `/biblioteca`.
4. Crear `lib/games.ts` additions: tipos `ActivityRow` y `TopPlayer`, y las constantes `RECENT_ACTIVITY` y `TOP_TODAY`.
5. Crear `components/reveal.tsx` (client): envuelve `children` en un elemento con clase `reveal`, añade `reveal-armed` al montar y `in` cuando entra al viewport (umbral 0,12), desconectando el observador tras activarse. Respeta `prefers-reduced-motion`. Acepta `delay` opcional (`transitionDelay`) para escalonar tarjetas.
6. Crear los componentes de presentación del Home: `components/home-silhouettes.tsx` (8 SVG decorativos con `aria-hidden`), `components/feature-icon.tsx` (GAMEPAD, FREE, TROPHY, ROCKET) y `components/mini-card.tsx` (enlace a `/juegos/[id]`).
7. Reescribir `app/page.tsx` como el Home completo, con `next/link` para todos los CTA: EXPLORAR JUEGOS, VER TODOS LOS JUEGOS e INSERTAR MONEDA → `/biblioteca`; CREAR CUENTA y EMPEZAR GRATIS → `/acceso`; VER SALÓN → `/salon`. Añadir `metadata` con título "Arcade Vault · Portal Retro". Prueba manual: recorrer las 6 secciones y comprobar que `.reveal` anima al hacer scroll.
8. Crear `components/highlight-icon.tsx` y `components/contact-form.tsx` (client: estado del formulario, vibración con `shake` durante 400 ms si falta algún campo, estado `sent` con terminal y "ENVIAR OTRO MENSAJE"). Crear `app/acerca/page.tsx` con hero, divisor, formulario y `metadata`. Prueba manual: enviar vacío vibra; enviar con datos muestra "MENSAJE RECIBIDO… GRACIAS, {NOMBRE}".
9. Actualizar `components/nav.tsx` y, si procede, `components/footer.tsx`: añadir "Inicio" (`/`, activo solo con `pathname === "/"`) y "Acerca de" (`/acerca`) en la barra y en el panel móvil, y apuntar el logo a `/`. Prueba manual: el enlace activo cambia en cada ruta y el menú móvil sigue cerrándose con Escape, backdrop y clic en enlace.
10. Revisar responsive en 1440, 768 y 375 px, ejecutar `npm run lint` y `npm run build`, y actualizar `CLAUDE.md` (tabla de rutas y estado).

## Criterios de aceptación

- [x] `npm run lint` y `npm run build` terminan sin errores.
- [x] La consola del navegador no muestra errores ni warnings de hidratación en `/`, `/biblioteca`, `/acerca`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/acceso` y `/salon`.
- [x] `/` muestra el hero con el título "EL ARCADE CLÁSICO ESTÁ DE VUELTA" y los botones "EXPLORAR JUEGOS" y "CREAR CUENTA".
- [x] `/` muestra las secciones `// 01`, `// 02`, `// 03` y `// 04` más el bloque de estadísticas y el CTA final "¿LISTO PARA JUGAR?".
- [x] La sección `// 01` muestra 4 tarjetas y la `// 02` muestra 6 mini-cards.
- [x] Hacer clic en una mini-card navega a `/juegos/[id]` del juego correspondiente.
- [x] "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS" e "INSERTAR MONEDA" navegan a `/biblioteca`.
- [x] "CREAR CUENTA" y "EMPEZAR GRATIS" navegan a `/acceso`; "VER SALÓN" navega a `/salon`.
- [x] "ÚLTIMAS PUNTUACIONES" muestra 7 filas y "TOP JUGADORES · HOY" muestra 5 filas, con números formateados en `es-ES`.
- [x] `/biblioteca` muestra las 8 tarjetas; el chip "PUZZLE" deja solo CAÍDA y buscar "zzz" muestra "NO HAY RESULTADOS".
- [x] "VOLVER AL VAULT" en el Reproductor y el botón de volver del Detalle llevan a `/biblioteca`.
- [x] Tras iniciar sesión como "kai" o pulsar "JUGAR COMO INVITADO", se redirige a `/biblioteca`.
- [x] El Nav muestra cuatro enlaces (Inicio, Biblioteca, Salón de la Fama, Acerca de) y solo uno está activo por ruta; en `/juegos/*` está activo "Biblioteca".
- [x] Las secciones con `.reveal` quedan visibles tras hacer scroll y también con `prefers-reduced-motion: reduce` activado.
- [x] Con JavaScript deshabilitado el contenido de `/` es visible (no queda oculto por `.reveal`).
- [x] En `/acerca`, enviar el formulario con algún campo vacío no muestra el estado de éxito y aplica la clase `shake` durante 400 ms.
- [x] En `/acerca`, enviar con nombre "kai" muestra "MENSAJE RECIBIDO" y "GRACIAS, KAI"; "ENVIAR OTRO MENSAJE" vuelve al formulario vacío.
- [x] El `<title>` de `/` es "Arcade Vault · Portal Retro" y `/biblioteca` y `/acerca` tienen títulos distintos entre sí.
- [x] A 375 px de ancho no hay scroll horizontal en `/` ni en `/acerca`, y el botón hamburguesa abre el panel móvil con los cuatro enlaces.
- [x] Ninguna petición de red sale del formulario de contacto al enviarlo.
- [x] Ningún archivo del proyecto contiene lógica de un juego real.

## Decisiones

- **Sí:** el Home pasa a ser `/` y la Biblioteca se mueve a `/biblioteca`. Es la estructura de navegación de la plantilla (Inicio / Biblioteca / Salón / Acerca de) y una portada con propuesta de valor es mejor primera impresión que una grilla.
- **No:** mantener la Biblioteca en `/` y esconder la landing en `/inicio`. Deja una portada sin presentación y contradice el diseño.
- **Sí:** incluir `/acerca` con contacto en este spec. La carpeta de referencia se llama `home-about` y el Nav de la plantilla ya enlaza "Acerca de"; dejarlo fuera dejaría un enlace huérfano o un Nav distinto al diseño.
- **No:** enviar el formulario de contacto a un backend. Es el mismo criterio de SPEC 01: solo capa visual.
- **Sí:** las mini-cards salen de `GAMES` real. Así enlazan a juegos que existen y no se duplican datos.
- **Sí:** actividad y top del Home como arrays mock estáticos, tal cual la plantilla. Evita hidratación inconsistente y mantiene el texto del diseño.
- **No:** derivar la actividad de `seededScores`. Más coherente con el Salón, pero se aleja de los textos de la plantilla sin aportar valor ahora.
- **Sí:** copiar el copy de la plantilla tal cual, incluidas cifras como "12+ JUEGOS" y la sección PRECIOS. Es un MVP visual con datos mock; el copy se revisará cuando existan datos reales.
- **No:** quitar PRECIOS ni ajustar las cifras. Rompería la numeración `// 01`–`// 04` y se aleja del diseño.
- **Sí:** `Reveal` como componente cliente con `IntersectionObserver`, con contenido visible por defecto y `reveal-armed` añadido tras montar. Mantiene las páginas como Server Components, evita parpadeos de hidratación y respeta `prefers-reduced-motion`.
- **No:** un hook global con `querySelectorAll(".reveal")` como en la plantilla. Es frágil con navegación cliente y poco idiomático en React.
- **Sí:** enlaces con `next/link` en lugar de `navigate()`. Mantiene URLs compartibles y botón atrás, como en SPEC 01.
- **Sí:** tras login o invitado se redirige a `/biblioteca` en lugar de `/`. Si fuera a `/`, el usuario recién registrado vería de nuevo el CTA "CREAR CUENTA". Esto modifica el criterio de SPEC 01 que decía "redirige a `/`".
- **No:** ocultar los CTA de registro cuando hay sesión. Exigiría leer `av_user` en el Home y complicar la hidratación; queda para un spec con autenticación real.
- **Sí:** reutilizar las clases `av-*` y las clases de la plantilla en `globals.css`. **No:** reescribirlas a utilidades Tailwind (mismo criterio que SPEC 01).
- **Sí:** metadata del Home ("Arcade Vault · Portal Retro"). **No:** cargar Press Start 2P como la plantilla ni corregir el 404 HTTP; son ajustes aparte pendientes de SPEC 01.
- **Sí:** diseño de UI guiado por `/frontend-design`, como indica `CLAUDE.md`.

## Riesgos

| Riesgo                                                                                       | Mitigación                                                                                                       |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Enlaces a `/` que quedan sin actualizar y llevan al Home en vez de a la Biblioteca           | El paso 3 lista cada archivo; verificar con `grep` de `href="/"` y `push("/")` al terminar.                       |
| `.reveal` oculta contenido si el JS falla o hay `prefers-reduced-motion`                      | La opacidad 0 solo aplica con `reveal-armed`, añadida por el cliente; con reduced-motion se muestra directamente. |
| Errores de hidratación por animaciones o `IntersectionObserver` en render                    | El observador se crea solo dentro de `useEffect`; el HTML del servidor no depende del estado del cliente.        |
| Mover la Biblioteca rompe el caso `/juegos/[id]` activo en el Nav                            | El paso 9 mantiene "Biblioteca" activa para `/biblioteca` y `/juegos/*` y se comprueba a mano.                   |
| Copy de la plantilla que promete funciones inexistentes (ranking global, sin anuncios, etc.) | Se documenta como copy provisional; se revisa en el spec que implemente esas funciones.                          |
| Desbordamiento horizontal en móvil por siluetas flotantes absolutas                           | Contenedor del hero con `overflow: hidden` y revisión a 375 px en el paso 10.                                    |

## Notas de implementación

Desviaciones y hallazgos respecto al plan, verificados con Playwright sobre el build de producción (`next start`):

- **Paso 2:** el CSS de Home y Acerca de ya estaba en `app/globals.css` (commit `d09bf38`); solo se fusionó la regla duplicada `.top-row`. Las ~119 reglas del widget "gamepad" de la plantilla (`.gp-*`, `.dp-*`, `.ab-*`, `.lg-*`, `.score-pop`, `.gp-themer`) no se portaron porque ninguna pantalla las usa.
- **Nav (paso 9):** con cuatro enlaces la barra no cabe por debajo de ~965 px, así que el menú hamburguesa pasa de ≤ 840 px a ≤ 980 px, y entre 981 y 1280 px la barra se compacta (sin contador de créditos). Esto afecta a todas las pantallas.
- **Responsive:** `.activity-grid` usa `minmax(0, 1fr)` a ≤ 900 px para evitar desbordamiento horizontal a 375 px.
- **Formulario de contacto:** `<form noValidate>`, de modo que solo cuenta que ningún campo esté vacío (un correo mal formado no bloquea el envío con el aviso nativo del navegador).
- **`Reveal`:** acepta además `aria-hidden` (para el divisor decorativo).
- **Botón `JUGAR` de la tarjeta de la Biblioteca:** sigue yendo al Detalle (`/juegos/[id]`), como establece SPEC 01; solo `JUGAR AHORA` va a `/jugar`.
- **`/games`:** no existe ni se creó ninguna redirección; la ruta oficial es `/biblioteca`.
- **Pendiente sin causa determinada:** en `next dev` algunos clics (un CTA del Home, un login, una entrada como invitado) no navegaron dentro del tiempo de espera en ejecuciones largas de Playwright; no se reprodujo con el build de producción (24 de 24 secuencias de login e invitado correctas). Probablemente un clic antes de la hidratación.

## Lo que **no** entra en este spec

- Envío real del formulario de contacto.
- Actividad, estadísticas o ranking reales.
- Pagos, planes o cualquier lógica de precios.
- CTA que cambian según la sesión.
- 404 real con código HTTP 404.
- Cambios de fuente (Press Start 2P) fuera de lo que ya hay.
- Juegos reales, backend, autenticación real y tests automatizados.

Cada uno, si llega, va en su propio spec.
