# SPEC 01 — MVP visual: pantallas de Arcade Vault

> **Status:** Aprobado
> **Depends on:** Ninguna
> **Date:** 2026-10-09
> **Objective:** Implementar en Next.js (App Router) las cinco pantallas de `references/templates/` (Biblioteca, Detalle, Reproductor, Acceso y Salón de la Fama) con datos mock y sin ningún juego real.

---

## Por qué existe este spec

El repo solo tiene el scaffold de Create Next App con la capa de estilos ya aplicada (`app/layout.tsx` con fuentes y fondos, `app/globals.css` con las clases `av-*`). Las plantillas de `references/templates/` son un prototipo en React por CDN con router por hash. Este spec lo traslada a rutas reales de Next.js 16 manteniendo el diseño.

## Alcance

**Dentro:**

- Navegación superior (`Nav`) con menú móvil, contador de créditos decorativo y botón de sesión.
- Footer global.
- Pantalla **Biblioteca**: hero, buscador por nombre, chips de categoría, grilla de tarjetas con inclinación al pasar el mouse y estado "NO HAY RESULTADOS".
- Pantalla **Detalle** del juego: portada, etiquetas, descripción, estadísticas, botones y ranking lateral de 10 filas.
- Pantalla **Reproductor**: HUD (jugador, puntaje, vidas, nivel), marco CRT con arena decorativa, pausa, botón FIN, modal de fin de juego con guardado de puntuación.
- Pantalla **Acceso**: pestañas Iniciar sesión / Crear cuenta, formulario, "Jugar como invitado" y botones sociales (Google, GitHub) sin función.
- Pantalla **Salón de la Fama**: pestañas por juego, podio top 3, tabla de 12 filas y fila "tu mejor marca" si hay sesión.
- Sesión simulada en `localStorage`.
- Datos mock tipados en TypeScript.
- Verificar que `app/globals.css` cubre todas las clases usadas por las plantillas y completar lo que falte.

**Fuera de alcance (specs futuros):**

- Cualquier juego real (lógica, canvas, controles). La arena del reproductor es decorativa.
- Backend, base de datos, API de puntuaciones o ranking real.
- Autenticación real (validación, hashing, cookies, OAuth con Google/GitHub).
- Registro de partidas y estadísticas reales (`plays`, `best`).
- Tests automatizados (no hay runner configurado).
- Internacionalización: la UI queda solo en español.

## Modelo de datos

Archivo nuevo `lib/games.ts` (puerto de `data.jsx`):

```ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "green" | "yellow";

export interface Game {
  id: string; // slug usado en la URL, p. ej. "bloque-buster"
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string; // clase CSS, p. ej. "cover-bricks"
  color: GameColor;
  best: number;
  plays: string; // ya formateado, p. ej. "12.4K"
}

export const GAMES: Game[]; // los 8 juegos de data.jsx
export const CATS = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"] as const;

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}
export function seededScores(seed: number, count?: number): ScoreRow[]; // determinista
```

Sesión y puntuaciones locales (solo en el navegador):

```ts
// localStorage["av_user"]   -> { name: string } | ausente (invitado)
// localStorage["av_scores"] -> { game: string; score: number; name: string; at: number }[]
```

Convenciones:

- Los números se formatean con `toLocaleString("es-ES")`.
- `seededScores` usa el mismo generador congruencial de la plantilla; las semillas son `id.length * 17 + 3` (Detalle) y `id.length * 23 + 7` (Salón).
- `name` del usuario: mayúsculas, máximo 10 caracteres, por defecto `PLAYER1`.

## Rutas

| Ruta                 | Pantalla         | Tipo de componente                                   |
| -------------------- | ---------------- | ---------------------------------------------------- |
| `/`                  | Biblioteca       | Server page + `LibraryClient` (filtros)              |
| `/juegos/[id]`       | Detalle          | Server page, `notFound()` si el `id` no existe       |
| `/juegos/[id]/jugar` | Reproductor      | Server page + `GamePlayer` client                    |
| `/acceso`            | Acceso           | Server page + `AuthForm` client                      |
| `/salon`             | Salón de la Fama | Server page + `HallOfFameClient` (pestañas + sesión) |

Antes de escribir código se debe leer `node_modules/next/dist/docs/` sobre `cacheComponents`, `params` asíncronos y `generateStaticParams`, como exige `CLAUDE.md`.

## Plan de implementación

1. Leer las guías de Next.js relevantes en `node_modules/next/dist/docs/`. Comparar `app/globals.css` con `references/templates/styles.css` y listar clases faltantes.
2. Crear `lib/games.ts` con tipos, `GAMES`, `CATS` y `seededScores`. Comprobar con `npm run build` que compila.
3. Crear `components/session-provider.tsx` (client): contexto con `user`, `login`, `logout`, y `saveScore`, leyendo/escribiendo `av_user` y `av_scores` dentro de `useEffect` y con `try/catch`. Envolver `children` en `app/layout.tsx`.
4. Crear `components/nav.tsx` y `components/footer.tsx`; montarlos en `app/layout.tsx`. Enlaces con `next/link`; activo según `usePathname()`. Prueba manual: el menú móvil abre y cierra.
5. Implementar Biblioteca: `app/page.tsx`, `components/game-card.tsx`, `components/library-client.tsx` (búsqueda + chips + estado vacío). Prueba manual: filtrar por "ARCADE" y buscar "zzz".
6. Implementar Detalle: `app/juegos/[id]/page.tsx` con `generateStaticParams` y `notFound()`. Prueba manual: abrir `/juegos/caida` y `/juegos/no-existe`.
7. Implementar Acceso: `app/acceso/page.tsx` y `components/auth-form.tsx` (pestañas, login mock, invitado). Prueba manual: entrar con "kai" y ver "KAI ▾" en el nav.
8. Implementar Salón de la Fama: `app/salon/page.tsx` y `components/hall-of-fame-client.tsx`. Prueba manual: cambiar de pestaña cambia podio y tabla; con sesión aparece la fila "tu mejor marca".
9. Implementar Reproductor: `app/juegos/[id]/jugar/page.tsx` y `components/game-player.tsx` (HUD, pausa, FIN, modal, guardar puntuación). Prueba manual: pausar detiene el puntaje, FIN abre el modal y guardar escribe en `av_scores`.
10. Revisar responsive (móvil y escritorio), `npm run lint` y `npm run build`.

Cada paso deja la app ejecutable con `npm run dev`.

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` terminan sin errores.
- [ ] La consola del navegador no muestra errores ni warnings de hidratación en ninguna de las 5 rutas.
- [ ] `/` muestra las 8 tarjetas de juego.
- [ ] Elegir el chip "PUZZLE" deja solo la tarjeta CAÍDA.
- [ ] Buscar "zzz" muestra "NO HAY RESULTADOS".
- [ ] Hacer clic en una tarjeta o en JUGAR navega a `/juegos/[id]`.
- [ ] `/juegos/no-existe` muestra la página 404.
- [ ] El Detalle muestra 10 filas en "MEJORES PUNTUACIONES" y el botón "JUGAR AHORA" lleva a `/juegos/[id]/jugar`.
- [ ] El Reproductor suma puntaje mientras no está en pausa y lo detiene al pulsar PAUSA.
- [ ] Pulsar FIN abre el modal con la puntuación final; "GUARDAR PUNTUACIÓN" añade una entrada a `localStorage["av_scores"]` y muestra "PUNTUACIÓN GUARDADA\_".
- [ ] "JUGAR DE NUEVO" reinicia puntaje, vidas y nivel; "VOLVER AL VAULT" navega a `/`.
- [ ] En `/acceso`, enviar el formulario con usuario "kai" guarda `av_user = {"name":"KAI"}` y redirige a `/`.
- [ ] "JUGAR COMO INVITADO" redirige a `/` sin guardar `av_user`.
- [ ] La pestaña "CREAR CUENTA" muestra el campo de correo; "INICIAR SESIÓN" lo oculta.
- [ ] Con sesión, el nav muestra el nombre del usuario; al pulsarlo se cierra la sesión y vuelve a "Iniciar Sesión".
- [ ] La sesión se conserva tras recargar la página.
- [ ] `/salon` muestra podio con 3 posiciones y tabla con 12 filas; cambiar de juego cambia los datos.
- [ ] En `/salon` la fila "TU MEJOR MARCA" aparece solo con sesión iniciada.
- [ ] A 375 px de ancho no hay scroll horizontal y el botón hamburguesa abre el panel móvil.
- [ ] Ningún archivo del proyecto contiene lógica de un juego real.

## Decisiones

- **Sí:** rutas reales del App Router. Permite URLs compartibles y es lo idiomático en Next.js 16.
- **No:** replicar el router por hash de la plantilla. Va contra el App Router y rompe el botón atrás y los enlaces.
- **Sí:** sesión mock en `localStorage` (`av_user`), igual que la plantilla. Es suficiente para una entrega solo visual.
- **No:** cookies con Server Actions. Se sale de "solo parte visual" y se deja para el spec de autenticación.
- **Sí:** el Reproductor conserva el puntaje simulado, la pausa y el modal de la plantilla para validar el flujo completo de guardado.
- **No:** juegos reales ni canvas. El enunciado lo excluye explícitamente.
- **Sí:** reutilizar el CSS global ya portado (clases `av-*`) y completar solo lo faltante.
- **No:** reescribir a utilidades Tailwind. Riesgo de divergir del diseño de la plantilla.
- **Sí:** datos mock tipados en `lib/games.ts` con generador determinista, para evitar diferencias de hidratación.
- **Sí:** diseño de UI guiado por `/frontend-design`, como indica `CLAUDE.md`.

## Riesgos

| Riesgo                                                                   | Mitigación                                                                                                 |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `cacheComponents` cambia la semántica de renderizado dinámico            | Leer las guías antes de empezar. Los componentes que usan `localStorage` son client y leen en `useEffect`. |
| Errores de hidratación por leer `localStorage` o `Math.random` en render | Estado inicial neutro (sin usuario, puntaje 0) y lectura/aleatoriedad solo dentro de efectos.              |
| `localStorage` deshabilitado o con datos corruptos                       | Todo acceso va en `try/catch`; si falla, se opera como invitado.                                           |
| `params` es asíncrono en esta versión de Next.js                         | Tipar con los helpers globales (`PageProps<"/juegos/[id]">`) y hacer `await params`.                       |
| Clases CSS de la plantilla ausentes en `globals.css`                     | El paso 1 las lista y el paso 10 verifica visualmente cada pantalla.                                       |

## Lo que **no** entra en este spec

- Ningún juego jugable.
- Backend, base de datos o ranking real.
- Autenticación real u OAuth.
- Tests automatizados.
- Multiidioma.

Cada uno, si llega, va en su propio spec.
