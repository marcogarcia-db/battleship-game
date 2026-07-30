import { describe, expect, it } from 'vitest'
import {
  FLEET,
  ORIENTATION,
  SHOT_RESULT,
  createAI,
  createBoard,
  fireAt,
  isFleetDestroyed,
  nextShot,
  placeFleetRandomly,
  placeShip,
  registerResult,
} from './index.js'

const cruiser = { id: 'cruiser', name: 'Cruzador', size: 3 }

/** Deterministic replacement for Math.random. */
function sequence(values) {
  let index = 0
  return () => values[index++ % values.length]
}

/** Plays a full AI-only game and returns the shots it took. */
function playFullGame(random = Math.random) {
  let board = placeFleetRandomly(createBoard(), FLEET, random)
  let ai = createAI()
  const shots = []

  while (!isFleetDestroyed(board) && shots.length < 100) {
    const shot = nextShot(ai, board, random)
    expect(shot).not.toBeNull()
    const outcome = fireAt(board, shot.row, shot.col)
    expect(outcome.result).not.toBe(SHOT_RESULT.INVALID)
    board = outcome.board
    ai = registerResult(ai, shot, outcome.result, board)
    shots.push(shot)
  }

  return { board, shots }
}

describe('nextShot', () => {
  it('always picks an untried cell inside the grid', () => {
    let board = createBoard()
    const ai = createAI()
    for (let i = 0; i < 100; i += 1) {
      const shot = nextShot(ai, board)
      expect(shot).not.toBeNull()
      expect(board.shots[shot.row][shot.col]).toBeNull()
      board = fireAt(board, shot.row, shot.col).board
    }
    expect(nextShot(ai, board)).toBeNull()
  })

  it('hunts on the parity mask while no hit is pending', () => {
    const shot = nextShot(createAI(), createBoard(), sequence([0]))
    expect((shot.row + shot.col) % 2).toBe(0)
  })

  it('falls back to the remaining cells when the parity mask is exhausted', () => {
    let board = createBoard()
    for (let row = 0; row < board.size; row += 1) {
      for (let col = 0; col < board.size; col += 1) {
        if ((row + col) % 2 === 0) board = fireAt(board, row, col).board
      }
    }
    const shot = nextShot(createAI(), board, sequence([0]))
    expect((shot.row + shot.col) % 2).toBe(1)
  })
})

describe('target mode', () => {
  it('queues the neighbours of a hit', () => {
    const board = placeShip(createBoard(), cruiser, 4, 4, ORIENTATION.HORIZONTAL)
    const shot = { row: 4, col: 5 }
    const outcome = fireAt(board, shot.row, shot.col)
    const ai = registerResult(createAI(), shot, outcome.result, outcome.board)

    expect(ai.mode).toBe('target')
    expect(ai.queue).toEqual(
      expect.arrayContaining([
        { row: 3, col: 5 },
        { row: 5, col: 5 },
        { row: 4, col: 4 },
        { row: 4, col: 6 },
      ]),
    )
    expect(nextShot(ai, outcome.board)).toEqual(ai.queue[0])
  })

  it('keeps only the aligned candidates after a second hit', () => {
    let board = placeShip(createBoard(), cruiser, 4, 4, ORIENTATION.HORIZONTAL)
    let ai = createAI()

    let outcome = fireAt(board, 4, 4)
    board = outcome.board
    ai = registerResult(ai, { row: 4, col: 4 }, outcome.result, board)

    outcome = fireAt(board, 4, 5)
    board = outcome.board
    ai = registerResult(ai, { row: 4, col: 5 }, outcome.result, board)

    // Only the two ends of the discovered line remain, never the perpendicular cells.
    expect(ai.queue).toEqual([
      { row: 4, col: 3 },
      { row: 4, col: 6 },
    ])
  })

  it('goes back to hunting after sinking a ship', () => {
    let board = placeShip(createBoard(), cruiser, 0, 0, ORIENTATION.VERTICAL)
    let ai = createAI()

    for (const shot of [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }]) {
      const outcome = fireAt(board, shot.row, shot.col)
      board = outcome.board
      ai = registerResult(ai, shot, outcome.result, board)
    }

    expect(ai).toEqual({ mode: 'hunt', queue: [], currentHits: [] })
  })

  it('drops queued cells that were already shot', () => {
    let board = placeShip(createBoard(), cruiser, 4, 4, ORIENTATION.HORIZONTAL)
    board = fireAt(board, 3, 5).board
    const outcome = fireAt(board, 4, 5)
    const ai = registerResult(createAI(), { row: 4, col: 5 }, outcome.result, outcome.board)
    expect(ai.queue).not.toContainEqual({ row: 3, col: 5 })
  })

  it('does not queue cells outside the grid', () => {
    const board = placeShip(createBoard(), cruiser, 0, 0, ORIENTATION.HORIZONTAL)
    const outcome = fireAt(board, 0, 0)
    const ai = registerResult(createAI(), { row: 0, col: 0 }, outcome.result, outcome.board)
    expect(ai.queue.every((cell) => cell.row >= 0 && cell.col >= 0)).toBe(true)
  })
})

describe('full AI games', () => {
  it('never repeats a shot and always finishes the fleet', () => {
    for (let run = 0; run < 30; run += 1) {
      const { board, shots } = playFullGame()
      expect(isFleetDestroyed(board)).toBe(true)

      const keys = shots.map((shot) => `${shot.row},${shot.col}`)
      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  it('is better than shooting purely at random', () => {
    const totals = []
    for (let run = 0; run < 20; run += 1) totals.push(playFullGame().shots.length)
    const average = totals.reduce((sum, value) => sum + value, 0) / totals.length
    expect(average).toBeLessThan(80)
  })
})
