import { hasBeenShot, isInsideBoard } from './board.js'
import { SHOT_RESULT } from './constants.js'

/**
 * "Hunt / target" AI.
 *
 * - hunt mode: random shot over the untried cells of a parity mask (a ship of
 *   size >= 2 always covers at least one cell of the mask, so half the board is
 *   enough to find every ship).
 * - target mode: after a hit, shoots the neighbours of that hit. With two or
 *   more hits on the same ship it only keeps the candidates aligned with them.
 *
 * The state is a plain object and every function is pure.
 */
export function createAI() {
  return { mode: 'hunt', queue: [], currentHits: [] }
}

function neighbours({ row, col }) {
  return [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ]
}

function sameCell(a, b) {
  return a.row === b.row && a.col === b.col
}

/** Candidates aligned with the confirmed hits of the ship being targeted. */
function alignedCandidates(hits) {
  const sameRow = hits.every((hit) => hit.row === hits[0].row)
  const rows = hits.map((h) => h.row)
  const cols = hits.map((h) => h.col)

  if (sameRow) {
    const row = hits[0].row
    return [
      { row, col: Math.min(...cols) - 1 },
      { row, col: Math.max(...cols) + 1 },
    ]
  }
  const col = hits[0].col
  return [
    { row: Math.min(...rows) - 1, col },
    { row: Math.max(...rows) + 1, col },
  ]
}

function availableCells(board, cells) {
  return cells.filter((cell) => isInsideBoard(board, cell.row, cell.col) && !hasBeenShot(board, cell.row, cell.col))
}

/**
 * Picks the next shot against `board` (the board the AI is shooting at).
 * Returns `null` when no cell is left.
 */
export function nextShot(ai, board, random = Math.random) {
  const queued = availableCells(board, ai.queue)
  if (queued.length > 0) return queued[0]

  const untried = []
  for (let row = 0; row < board.size; row += 1) {
    for (let col = 0; col < board.size; col += 1) {
      if (!hasBeenShot(board, row, col)) untried.push({ row, col })
    }
  }
  if (untried.length === 0) return null

  const parity = untried.filter((cell) => (cell.row + cell.col) % 2 === 0)
  const pool = parity.length > 0 ? parity : untried
  return pool[Math.floor(random() * pool.length)]
}

/** Returns the new AI state after `shot` produced `result` on `board`. */
export function registerResult(ai, shot, result, board) {
  if (result === SHOT_RESULT.SUNK) {
    return { mode: 'hunt', queue: [], currentHits: [] }
  }

  if (result === SHOT_RESULT.HIT) {
    const currentHits = [...ai.currentHits, shot]
    const candidates =
      currentHits.length > 1 ? alignedCandidates(currentHits) : neighbours(shot)
    const queue = availableCells(board, candidates).filter(
      (cell) => !currentHits.some((hit) => sameCell(hit, cell)),
    )
    return { mode: 'target', queue, currentHits }
  }

  // A miss only removes the shot cell from the pending candidates.
  const queue = availableCells(board, ai.queue).filter((cell) => !sameCell(cell, shot))
  return {
    mode: ai.currentHits.length > 0 && queue.length > 0 ? 'target' : 'hunt',
    queue,
    currentHits: queue.length > 0 ? ai.currentHits : [],
  }
}
