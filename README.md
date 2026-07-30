# Battleship — Player vs AI

Battleship game playable in the browser against an AI, 100% client-side (React 18 + Vite).

## Play online

**https://marcogarcia-db.github.io/battleship-game/**

No login and no backend required: the AI runs in your browser.

## Languages

The interface is available in **English, Portuguese and Spanish**. The switcher sits at the top of
the screen and can be changed at any time, even during a game (messages already on screen are
re-translated). On the first visit the language is detected from the browser; after that the choice
is kept in `localStorage`.

## Running locally

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm test         # unit tests (Vitest)
npm run build    # production build into dist/
npm run preview  # serves the production build
npm run lint     # ESLint
```

## Rules

- A 10x10 board for each side.
- Standard fleet (identical for the player and the AI):

  | Ship | Size |
  | --- | --- |
  | Carrier | 5 |
  | Battleship | 4 |
  | Cruiser | 3 |
  | Submarine | 3 |
  | Destroyer | 2 |

- **Setup:** place the fleet by clicking your board (the *Rotate* button toggles
  horizontal/vertical), or use *Place randomly*. *Clear placement* restarts the setup. Ships must
  fit entirely inside the grid and cannot overlap; they may touch each other. The AI fleet is
  always placed randomly.
- **Battle:** turns alternate — one player shot, one AI shot. Click a cell of the enemy board to
  fire. Cells that were already attacked cannot be attacked again.
- Every shot returns **miss**, **hit** or **sunk** (when all cells of the ship have been hit).
- The first side to sink the whole enemy fleet wins. Game over is detected as soon as the last ship
  sinks, and the enemy board is revealed.

### Cell states

| Colour | Meaning |
| --- | --- |
| Blue | water, not attacked |
| Grey | one of your ships (only on your board) |
| Dark blue with `•` | miss |
| Orange with `✕` | hit |
| Red with `✕` | sunk ship |
| Green / red (setup) | valid / invalid placement preview |

## The AI

"Hunt / target" AI (`src/game/ai.js`):

- **hunt:** random shot restricted to a parity mask (`(row + col) % 2 === 0`). Since every ship is
  at least 2 cells long, it always covers at least one cell of the mask — half of the board is
  enough to find the whole fleet.
- **target:** on a hit, it queues the cells adjacent to that hit. With two or more hits on the same
  ship, it keeps only the candidates aligned with them (both ends of the line).
- When a ship sinks, the queue is cleared and the AI goes back to *hunt* mode.
- The AI never repeats a shot: candidates are filtered against the cells already attacked.

## Project structure

```
src/
  game/            pure game logic, no React dependency
    constants.js   board size, fleet, cell/result enums
    board.js       board creation, placement, firing, game over
    ai.js          hunt/target AI
    *.test.js      unit tests (Vitest)
  i18n/
    translations.js       en / pt / es strings
    index.js              translator, language detection and persistence
    LanguageProvider.jsx  React context holding the current language and `t()`
    translations.test.js  asserts key and placeholder parity across languages
  components/
    Board.jsx      10x10 grid with visual states and placement preview
  App.jsx          state machine: setup -> battle -> game over
```

48 unit tests in total (`npm test`).

The game logic is fully decoupled from the UI: `src/game/` does not import React and every function
is pure (it never mutates the board it receives), which makes the tests straightforward and avoids
shared-state bugs in React. It is also language-agnostic — ships only carry `id` and `size`, and the
UI translates the name from the `id`. Status messages are stored as a key plus parameters (never as
already rendered text), which is why switching the language mid-game also translates the message
currently on screen.

## Bugs found and fixed

See [BUGS.md](./BUGS.md).

## Deployment

Pushing to the `main` branch triggers the
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) workflow, which runs the tests, runs
`npm run build` and publishes `dist/` to GitHub Pages (Pages configured with *GitHub Actions* as the
source). The Vite `base` is `/battleship-game/`.
