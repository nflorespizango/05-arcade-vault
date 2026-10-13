# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault: an online platform to play games and compete for the highest score. The project follows a spec-driven workflow (`/spec` and `/spec-impl`) using the skills from `Klerith/fernando-skills` (installed with `npx skills@latest add Klerith/fernando-skills`). The README is in Spanish.

## Status

SPEC 01 (`specs/01-mvp-pantallas-visuales.md`) is **Implementado**: the five screens from `references/templates/` are built as real App Router routes with mock data. Only the visual layer exists; there is no real game, backend, database or real authentication.

SPEC 02 (`specs/02-home-y-acerca-de.md`) is **implemented and verified** (its 10 plan steps and acceptance criteria; the spec header still says `Aprobado` until the owner updates it). It added the landing at `/`, moved the Biblioteca to `/biblioteca` and added `/acerca` with a contact form. Everything is still mock/visual: the contact form sends nothing and the Home activity, stats and pricing are static copy from `references/templates/home-about/`.

| Route | Screen | Main files |
| --- | --- | --- |
| `/` | Home / landing (hero with floating silhouettes, `// 01` features, `// 02` mini-cards, stats, `// 03` live activity, `// 04` pricing, final CTA) | `app/page.tsx`, `components/home-silhouettes.tsx`, `components/feature-icon.tsx`, `components/mini-card.tsx`, `components/reveal.tsx` |
| `/biblioteca` | Biblioteca (hero, search, category chips, game grid) | `app/biblioteca/page.tsx`, `components/library-client.tsx`, `components/game-card.tsx` |
| `/acerca` | Acerca de (mission hero, 3 highlights, pixel divider, contact form with terminal success state) | `app/acerca/page.tsx`, `components/highlight-icon.tsx`, `components/contact-form.tsx` |
| `/juegos/[id]` | Detalle del juego (stats, top 10) | `app/juegos/[id]/page.tsx` |
| `/juegos/[id]/jugar` | Reproductor (HUD, pause, FIN, game-over modal; decorative arena) | `app/juegos/[id]/jugar/page.tsx`, `components/game-player.tsx` |
| `/acceso` | Iniciar sesión / Crear cuenta / invitado | `app/acceso/page.tsx`, `components/auth-form.tsx` |
| `/salon` | Salón de la Fama (tabs per game, podium, 12-row table) | `app/salon/page.tsx`, `components/hall-of-fame-client.tsx` |

Shared pieces: `components/nav.tsx` (four links: Inicio `/` active only on `/`, Biblioteca active on `/biblioteca` and `/juegos/*`, Salón de la Fama, Acerca de; hamburger up to 980 px, which also closes with Escape, backdrop click and link click), `components/footer.tsx`, `components/session-provider.tsx` (mock session), `components/reveal.tsx` (client; scroll-reveal), `lib/games.ts` (typed mock data, deterministic `seededScores`, plus `RECENT_ACTIVITY` and `TOP_TODAY` for the Home).

Navigation rules: "go to the library" links and the redirect after login/guest point to `/biblioteca`; the logo and "Inicio" point to `/`. There is no `/games` route or redirect. The `JUGAR` button on a library card goes to the Detalle (`/juegos/[id]`, as SPEC 01 says); only `JUGAR AHORA` in the Detalle goes to `/juegos/[id]/jugar`.

Mock persistence lives only in the browser's `localStorage`: `av_user` (`{ name }`, absent = guest) and `av_scores` (saved scores).

`.playwright-screenshots/screenshot-home.png` is the capture of the landing (`/`) at 1440 × 900, compared against `references/templates/home-about/`. The folder is git-ignored, so the capture is local only.

All Playwright MCP screenshots must be saved inside `.playwright-screenshots/`, named `screenshot-[screen-name].png` (e.g. `screenshot-home.png`).

### Known pending items

- `/juegos/no-existe` (and `/juegos/no-existe/jugar`) render the 404 UI but respond with HTTP 200. It behaved the same before wrapping `params` in `<Suspense>`. `dynamicParams` is not available with Cache Components, so a real 404 needs a check before streaming (e.g. a `proxy`). Deliberately left as is; see "Observaciones pendientes" in the spec.
- Optional tweak not applied: load Press Start 2P like the template. (The Home `<title>` is now "Arcade Vault · Portal Retro".)
- In `next dev`, a few clicks (a Home CTA, one login, one guest entry) intermittently did not navigate in Playwright runs and could not be reproduced afterwards (0 failures in 24 repeated login/guest sequences on the production build). Cause not determined; likely a click before hydration. If it shows up for real, investigate `router.push` in `components/auth-form.tsx` first.
- `.gp-*`, `.dp-*`, `.ab-*`, `.lg-*`, `.score-pop`, `.gp-themer` and related gamepad rules in `references/templates/home-about/styles.css` were deliberately not ported: no screen uses them.


There is no test runner configured.

## Next.js version warning

Stack: Next.js 16.4.0, React 19.3.0, Tailwind CSS 4, TypeScript (strict). This Next.js has breaking changes from older versions. Before writing code, read the relevant guide in `node_modules/next/dist/docs/` (`01-app`, `02-pages`, `03-architecture`, `04-community`; start from `index.md`) and heed deprecation notices. `AGENTS.md` is regenerated by `next dev`; leave it in place.

## Idioma
Responde siempre en español: explicaciones, preguntas, avances, resultados de pruebas e informes técnicos. No traduzcas nombres de archivos, variables, clases, métodos, comandos ni términos técnicos que deban conservarse en inglés.

## Skills
Usa siempre /frontend-design para diseñar la interfaz de usuario.

## Architecture notes

- App Router only (`app/`). Path alias `@/*` maps to the repo root.
- `next.config.ts` enables `cacheComponents` and `partialPrefetching`, plus `experimental.agentFeedback`. `cacheComponents` changes caching and dynamic-rendering semantics, so check the docs before using data fetching or request APIs.
- Tailwind is wired through Turbopack: `turbopack.rules` in `next.config.ts` runs `@tailwindcss/turbopack` on `*.css`. Styles are in `app/globals.css` (`@import "tailwindcss"`).
- `app/layout.tsx` types its props with the globally generated `LayoutProps<"/">` helper (no import needed). Fonts are Press Start 2P, JetBrains Mono and Courier Prime, loaded via `next/font/google` as CSS variables (`adjustFontFallback: false`). It mounts `SessionProvider`, `Nav` (inside `<Suspense>`) and `Footer`.
- Styles are the template's `av-*` classes (and the Home/Acerca classes from `home-about/styles.css`) ported into `app/globals.css`, plus a few Tailwind preflight fixes and responsive rules (≤ 980 / 900 / 720 / 480 px). The hamburger menu starts at ≤ 980 px (it was 840 px before SPEC 02; four links do not fit below ~965 px), and between 981 and 1280 px the nav is compacted. Grids that collapse to one column use `minmax(0, 1fr)` to avoid horizontal overflow. Do not rewrite these as Tailwind utilities.
- `.reveal` only hides content when the client adds `reveal-armed` (`components/reveal.tsx`, via ref + `IntersectionObserver` inside `useEffect`); without JavaScript or with `prefers-reduced-motion: reduce` the content stays visible.
- Do not run `npm run dev` and `npm run build` at the same time: both use `.next`, and a dev server started before a build serves stale CSS/JS. For verification, build and then `npx next start -p 3000`.
- With `cacheComponents`, pages that read `params` must pass the `params` promise to an async child wrapped in `<Suspense>` (see `app/juegos/[id]/page.tsx`); awaiting it at the top level raises an instant-navigation validation error in `next dev`.
