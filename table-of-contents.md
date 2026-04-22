# Table of Contents

## Root

| File | Purpose |
|------|---------|
| `index.html` | HTML entry point — favicon, meta tags, Google Fonts, mount div |
| `package.json` | Dependencies and scripts (`dev`, `build`, `lint`, `preview`) |
| `CLAUDE.md` | Agent context file — project overview, APIs, design decisions |
| `vite.config.ts` | Vite configuration |
| `tsconfig.json` | TypeScript config for app source |
| `tsconfig.node.json` | TypeScript config for Vite/Node tooling |
| `.eslintrc.cjs` | ESLint configuration |

## `src/`

Core application source.

| File | Purpose |
|------|---------|
| `main.tsx` | React entry point — renders `<App />` into the DOM |
| `App.tsx` | Main game component — state management, phase transitions, UI layout |
| `App.css` | App-level layout styles and utility classes |
| `index.css` | Global CSS variables, reset styles, base theming |
| `vite-env.d.ts` | Vite client type declarations |

## `src/types/`

TypeScript type definitions and constants.

| File | Exports |
|------|---------|
| `index.ts` | `Team`, `Player`, `Coach`, `SlotKey`, `SlotPick`, `TeamPicks`, `GamePhase`, `SLOT_KEYS`, `POSITION_MAP` |

## `src/services/`

External API integration and data fetching.

| File | Exports |
|------|---------|
| `api.ts` | `fetchTeams()`, `fetchRoster()`, `fetchAllRosters()` — all ESPN API calls |

## `src/hooks/`

Custom React hooks.

| File | Purpose |
|------|---------|
| `useGameData.ts` | Orchestrates all data loading (teams → rosters → coaches) with progress tracking. Returns `{ teams, playersByTeam, coachesByTeam, isLoading, loadingProgress }` |

## `src/components/`

UI components. Each component has a co-located `.css` file.

| Component | File | Purpose |
|-----------|------|---------|
| TeamSpinner | `TeamSpinner.tsx` / `.css` | Animated team logo spinner — preloads all 32 logos, stacks them with absolute positioning, toggles opacity |
| PlayerCardGrid | `PlayerCardGrid.tsx` / `.css` | Visual card grid of eligible players grouped by position, with filter chips and search. Includes DEF and HC cards. |
| ConfirmPick | `ConfirmPick.tsx` / `.css` | Modal overlay to confirm or cancel a pick |
| TeamCard | `TeamCard.tsx` / `.css` | Final 3×2 grid of selected picks, uses html2canvas for PNG download |

## `src/assets/`

Static assets (currently empty).

## `public/`

Vite public directory for static files served at root.
