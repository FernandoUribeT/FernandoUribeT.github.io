# Design system — Fernando Uribe Trujillo portfolio

Synced from the live portfolio (read-only). Every value below was found in a source file.
Main source: `index.html` inline `<style>` (lines 27–345); `en/index.html` mirrors it.
`propuesta-noah-tours/comun.css` is a separate client proposal (Noah Tours turquoise system) and is **not** part of this identity.

## Colors — default theme (dark) · `index.html:27-35`

| Token | Value | Usage |
| --- | --- | --- |
| `--bg` | `#04060a` | Page background |
| `--bg-2` | `#0a0d13` | Secondary background |
| `--panel` | `#0f131b` | Panels (a11y panel, inner blocks) |
| `--card` | `#1e2530` | Card surface |
| `--card-2` | `#252d3a` | Raised card / gradient start of `.hero-card` |
| `--line` | `#333d4c` | Borders, section outlines |
| `--line-2` | `#475268` | Stronger borders, hover borders |
| `--fg` | `#eef0f6` | Primary text |
| `--fg-dim` | `#9aa3b6` | Secondary text |
| `--fg-faint` | `#68718a` | Metadata (large/decorative only — low contrast on `--bg`) |
| `--accent` | `#f0b429` | Brand gold: primary button, brand mark, progress bar |
| `--accent-2` | `#ffd166` | Accent hover / highlight |
| `--glow` | `rgba(240,180,41,.14)` | Soft accent fill |
| `--luz` | `rgba(240,180,41,.38)` | Glow light |
| `--sombra` | `rgba(0,0,0,.85)` | Shadow color |
| `--tinte` | `rgba(255,255,255,.018)` | Subtle tint |
| `--velo` | `rgba(10,12,17,.82)` | Sticky nav veil (with `backdrop-filter: blur(12px)`) |
| (literal) | `#1a1204` | Text on gold (`.btn.primary`, corner tags) |

### Secondary palette · `index.html:326`

| Token | Dark | Claro | Contraste |
| --- | --- | --- | --- |
| `--azul` | `#4d9fff` | `#1e63c4` | `#67c8ff` |
| `--verde` | `#3ba55d` | `#1f7a3f` | `#5cff9d` |
| `--rojo` | `#ff6f5e` | `#c2321f` | `#ff8a7a` |
| `--violeta` | `#b78cff` | `#6d3fc4` | `#d0b0ff` |
| `--cian` | `#2ed3dd` | `#0a7d86` | `#5ff0fa` |
| `--tinta` / `--tinta-linea` | `#161d2a` / `#2b3547` | `#e8e3d6` / `#cdc6b6` | `#000` / `#fff` |
| `--wa` / `--wa-txt` | `#25d366` / `#0b2f19` | same | `#00ff85` |

### `html.a11y-claro` (light mode) · `index.html:270-272`

`--bg #fbfaf7` · `--bg-2 #f2f0ea` · `--panel #f1eee6` · `--card #fff` · `--card-2 #f7f5ef` · `--line #ddd8cd` · `--line-2 #c3bcae` · `--fg #16181d` · `--fg-dim #4a4f5c` · `--fg-faint #6d7382` · `--accent #9a6b00` · `--accent-2 #7d5600` · `--glow rgba(154,107,0,.09)` · `--luz rgba(154,107,0,.12)` · `--sombra rgba(70,58,32,.15)` · `--velo rgba(251,250,247,.88)`. Primary button text `#fff`.

### `html.a11y-contraste` · `index.html:266-269`

All surfaces `#000`, lines `#fff`, `--fg #fff`, `--fg-faint #ffe680`, `--accent #ffe600` (text on it `#000`), glows/shadows off, borders 2px.

## Typography

| Role | Value | Source |
| --- | --- | --- |
| Body | `-apple-system, BlinkMacSystemFont, "Segoe UI", "Liberation Sans", Arial, sans-serif`; 1rem / 1.65 | `index.html:51` |
| Display (`--display`) | `'Space Grotesk', system-ui, -apple-system, 'Segoe UI', sans-serif` — h1, h3, footer h2, `.role`, `.stat b` | `index.html:326` (`/fuentes/space-grotesk.woff2`, 300–700, swap) |
| Mono (`--mono`) | `ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` — eyebrows, tags, meta, nav links | `index.html:31` |
| h1 | `clamp(2rem, 6.2vw, 3.125rem)`, 800, lh 1.06, ls −.032em | `index.html:142` |
| Footer h2 | `clamp(1.3125rem, 3vw, 1.8125rem)` | `index.html:277` |
| Job h3 / Edu h3 / Card h3 | 1.3125rem / 1.1875rem / 1.0625rem | `index.html:166,190,210` |
| Lede | 1.125rem | `index.html:147` |
| Role | .875rem mono | `index.html:144` |
| Tag | .7812rem | `index.html:205` |
| Eyebrow | .6875rem mono uppercase | `index.html:161` |
| A11y text sizes | 112.5% / 128.125%; `a11y-fuente` → Verdana stack, lh 1.85 | `index.html:259-262` |

Artboards cannot load the woff2 file, so they use the full `--display` stack (Space Grotesk renders only where installed).

## Spacing & layout

- Container: `max-width: 1200px; padding: 0 24px` (`index.html:52`).
- Section: `padding: 44px 30px; margin-top: 26px; border: 1px solid var(--line); border-radius: 18px` — mobile `34px 18px`, radius 14px (`index.html:157`).
- Nav height 60px, `scroll-padding-top: 61px` (`index.html:36-65`).
- Card grid: `minmax(268px, 1fr)` (`index.html:183`).
- Recurring gaps: 8, 10, 14, 18, 24, 26px.

## Radius

`18px` sections · `14px` card, carousel frame, a11y panel · `12px` stat · `10px` button, feat, cert · `8px` nav link · `7px` tag · `6px` brand mark · `999px` chip, switch.

## Shadows

- Card hover: `0 14px 40px -18px var(--sombra)` (`index.html:194`).
- FABs: `0 10px 28px -8px var(--sombra)`; a11y panel: `0 20px 50px -14px var(--sombra)` (`index.html:239,242`).

## Motion

- Easing `--ease: cubic-bezier(.22,.61,.36,1)`; durations .2s / .25s / .28s / .55s / .6s.
- Hover lifts: card −4px, button −2px, tag −2px.
- Reveal `.rv`: opacity + translateY(18px→0); scroll-driven reveal is opacity + 16px translate only (masonry measures `getBoundingClientRect`, never scale).
- Reading progress: `nav::after`, 2px accent, `animation-timeline: scroll(root)` (`index.html:330-345`).
- `prefers-reduced-motion` and `html.a11y-quieto` disable all animation, transitions and scroll snap.

## Components

- **Nav**: sticky 60px, veil + blur, brand `FUT` with gold square, mono uppercase .75rem links, bordered `EN` language link.
- **Button `.btn`**: 1px border, radius 10px, padding 11px 17px, 15px SVG icon. `.primary` gold bg + `#1a1204` text; `.wa` WhatsApp green.
- **Card `.card`**: `--card` surface, radius 14px, mouse-tracking radial glow `::after`; `.hero-card` gradient `155deg, --card-2 → --card` with corner tag "Destacado" / "Demo en vivo".
- **Tag / chip**: tag radius 7px .7812rem mono; chip radius 999px; `.t-fuerte` strong tag.
- **Carousel**: aspect 900/495, radius 14px, 44px round arrows, crossfade .55s, 5.2s autoplay, mono caption.
- **Stat**: radius 12px, display-font number (`169`, `45/71`, `11`, `9.46`).
- **A11y FAB** (right 18px / bottom 18px, 52px gold circle) + 288px panel: 3 text sizes, toggles claro / contraste / quieto / fuente / links, reset; persisted in `localStorage 'a11y-prefs'`.
- **WhatsApp FAB** (left 18px / bottom 18px, 52px `#25d366`).
- **Section texture**: 120px blueprint grid SVG via `section::before` mask, accent tinted.

## Rules to keep in any redesign

1. Keep the three a11y modes (claro, contraste, quieto) and `prefers-reduced-motion`.
2. ES/EN parity (`pruebas/english-layout.test.js`).
3. Scroll-driven reveal + reading bar (`<style id="scroll-driven">`), snap controller `UMBRAL = 0.2`.
4. Never scale cards before the masonry script measures them.
5. Text on gold is `#1a1204` (dark) or `#fff` (claro); `--fg-faint` is not for body text.
