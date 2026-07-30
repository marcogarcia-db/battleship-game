# Bugs found and fixed

Every bug below was really found during development — either by the unit tests
(Vitest) or by manual/scripted testing of the game in the browser
(`npm run dev`). Each entry has the observed symptom, the root cause and the fix.

---

## 1. Player shot lost when two clicks land in the same React batch

**Observed symptom.** Clicking two cells of the enemy board quickly (A1 and B1,
within the same browser tick) marked only one of them: `A1` stayed `empty` and
only `B1` became `hit`. The player spent two turns and got a single shot.

**Root cause.** `handleFire` computed the new board outside the updater, from the
`enemyBoard` value captured during render:

```jsx
const { board, result, ship } = fireAt(enemyBoard, row, col)   // value from the render
setState((prev) => ({ ...prev, enemyBoard: board, turn: 'ai', ... }))
```

Both clicks happen before the next render, so both read the **same** stale
`enemyBoard`. The second `setState` overwrites the result of the first one, and
the first shot disappears. The `if (turn !== 'player') return` guard also used
the rendered `turn`, which is why it did not reject the second click.

**Fix.** The whole computation moved inside the updater, derived only from `prev`
— which makes the turn transition atomic and rejects the second click:

```jsx
setState((prev) => {
  if (prev.phase !== PHASE.BATTLE || prev.turn !== 'player') return prev
  const { board, result, ship } = fireAt(prev.enemyBoard, row, col)
  ...
})
```

**Verification.** Three clicks in the same tick now produce exactly one shot
(`A1 miss`, `B1 empty`, `C1 empty`) and a single AI turn.

---

## 2. Game freezing on "AI's turn..." forever

**Observed symptom.** During a long game in the browser everything stopped: the
indicator stayed on `AI's turn...`, the message on `You missed.`, both boards
frozen and no console error. The AI never fired again, and the player board still
had dozens of free cells (so it was not a lack of targets).

**Root cause.** The AI turn was scheduled by an effect with `[phase, turn]` as
dependencies. When the `setState` of the player's shot is processed in the **same
batch** as the AI's own `setState`, `turn` leaves `'ai'` and comes back to `'ai'`
within a single commit: the value does not change between renders, the effect
does not re-run and no new `setTimeout` is created. Since the AI only fires
inside that timeout, the game waits forever for a turn that is never scheduled.
(The last message being the player's instead of the AI's is precisely the
signature of that shared batch.)

**Fix.** The effect now depends on the whole state object, whose identity changes
on every update, so the scheduling is re-evaluated after any commit:

```jsx
useEffect(() => {
  if (phase !== PHASE.BATTLE || turn !== 'ai') return undefined
  aiTimer.current = setTimeout(() => { /* AI shot */ }, AI_DELAY_MS)
  return () => clearTimeout(aiTimer.current)
}, [state, phase, turn])
```

The fix for bug 1 removes the most common cause of the shared batch; this one
makes the scheduling robust even if it still happens.

**Verification.** Two full scripted games to the end (one win and one loss, ~57
AI shots) without freezing on any turn.

---

## 3. AI test asserting the wrong behaviour ("target" after the second hit)

**Observed symptom.** `npm test` failed on
`target mode > keeps only the aligned candidates after a second hit`:

```
expected [ { row: 4, col: 3 }, { row: 4, col: 6 } ] to deeply equal [ { row: 4, col: 6 } ]
```

**Root cause.** The bug was in the **test**, not in the AI. After two aligned
hits on `(4,4)` and `(4,5)` there are two plausible ends — `(4,3)` and `(4,6)` —
and the AI kept both, correctly. The expectation only accounted for one end,
which would discard half of the valid targets and make the AI miss ships
extending towards the "wrong" side.

**Fix.** The expectation was adjusted to both aligned ends, leaving the
`alignedCandidates` logic untouched. The test still asserts what matters:
candidates off the ship's axis are discarded.

---

## 4. Cell states disappearing under the cursor (hover overriding the colour)

**Observed symptom.** During manual placement the cell under the cursor did not
show the green/red preview — it stayed blue (the hover colour), so the ship's
first cell looked invalid/empty. The same happened in battle: hovering an already
shot `•` (miss) or `✕` hid the mark.

**Root cause.** CSS specificity, in **two** different hover rules:

1. `.cell:not(:disabled):hover` in `Board.css` (three selectors) beat
   `.cell--preview-valid` / `.cell--miss` (one selector), even though they were
   declared later in the file. A first attempt (`.cell.cell--preview-valid`) was
   still losing, which was confirmed by reading the cell's computed
   `background`: `rgb(23, 85, 127)` — the hover blue.
2. After fixing the first one, manual testing showed the cell under the cursor
   was **still** blue: the global `button:hover:not(:disabled)` rule in
   `App.css`, written for the control buttons, also matched the cells (which are
   `<button>` elements) and beat the state classes.

**Fix.** Hover no longer paints a background generically. In `Board.css` it only
changes `transform`, and the background is restricted to genuinely empty cells:

```css
.cell:not(:disabled):hover { transform: scale(1.06); }

.cell--empty:not(.cell--preview-valid):not(.cell--preview-invalid):not(:disabled):hover {
  background: #17557f;
}
```

And the global rule in `App.css` now skips the cells, which own their hover —
and also skips pressed toggle buttons, which would lose their colour the same
way (the active language button):

```css
button:not(.cell):not([aria-pressed='true']):hover:not(:disabled) { background: #17557f; }
```

**Verification.** A 5-cell preview shows up green including under the cursor
(anchor cell included), miss/hit/sunk marks stay visible on hover, and the
selected language keeps its highlight when hovered.

---

## 5. Debug instrumentation left in the component

**Observed symptom.** While scripting browser tests, a line exposing the enemy
board on `window` was added so the script could aim at the ships (and therefore
force a win/loss):

```jsx
if (import.meta.env.DEV) window.__enemy = state.enemyBoard
```

**Problem.** Besides being a side effect inside the render, leaking the enemy
fleet position is exactly the information a player must not have.

**Fix.** The line was removed after the manual test round; no enemy board
information is exposed in the final build (the published `dist` contains no
`window.__enemy`).
