# NFL Team Builder — Agent Context

## Overview

"Build a 17-0 NFL Team" is a single-page web game. A random NFL team is selected, and the player picks one person from that team's roster to fill one of 6 slots: **QB, RB, WR, TE, DEF, HC (Head Coach)**. This repeats until all 6 slots are filled, then the user can download their completed team card as a PNG.

## Tech Stack

- **React 18.2** + **TypeScript 5.2** + **Vite 5.1**
- **html2canvas** — generates downloadable PNG of the completed team card
- **CSS** — custom dark "NFL Draft night" aesthetic; fonts: Oswald, Barlow, Barlow Condensed (Google Fonts)
- No auth keys required for any API

## Data Sources (ESPN APIs, no auth)

| Endpoint | URL Pattern |
|----------|-------------|
| Teams list | `site.api.espn.com/apis/site/v2/sports/football/nfl/teams` |
| Team roster | `site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{id}/roster` |
| Coaches | `sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{year}/coaches?limit=50` |
| Season/year | `site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard` |

### Coach Data Quirk

The coaches endpoint returns ALL coaching staff (HCs, coordinators, assistants). Head coaches are identified by having an `experience` field — coordinators/assistants do not. The code filters on `coach.experience !== undefined` and uses `map.has(teamId)` to prevent overwrites (e.g., Jeff Hafley DC was overwriting Matt LaFleur HC for the Packers).

## Game Flow (Phases)

1. **loading** — Fetches teams, rosters (batched 8 at a time), and coaches
2. **ready** — All data loaded, "Spin" button shown
3. **spinning** — Team spinner animates through 32 team logos
4. **picking** — Player search + quick picks (DEF/HC) for the selected team
5. **confirming** — Modal overlay to confirm or cancel the pick
6. **complete** — All 6 slots filled, team card displayed with download button

## Key Design Decisions

- **Team spinner preloads all 32 logos** via `new Image()` on mount, renders all stacked with `position: absolute`, toggles `opacity` via CSS class — avoids flicker from swapping `src` attributes
- **Position mapping**: QB→QB, RB→RB, HB→RB, FB→RB, WR→WR, TE→TE (defined in `POSITION_MAP`)
- **DEF and HC** use quick-pick cards (not the player search input)
- Each team can only be used once across all 6 picks

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server (localhost:5173) |
| `npm run build` | TypeScript check + Vite production build |
| `npx tsc --noEmit` | Type-check without emitting |
| `npm run lint` | ESLint |

## File Structure

See `table-of-contents.md` for a full directory map.
