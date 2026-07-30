import { describe, expect, it } from 'vitest'
import {
  BOARD_SIZE,
  CELL,
  FLEET,
  ORIENTATION,
  SHOT_RESULT,
  canPlaceShip,
  cellState,
  createBoard,
  fireAt,
  hasBeenShot,
  isFleetDestroyed,
  isShipSunk,
  placeFleetRandomly,
  placeShip,
  remainingShips,
  removeShip,
  shipAt,
  shipCells,
} from './index.js'

const destroyer = { id: 'destroyer', size: 2 }
const cruiser = { id: 'cruiser', size: 3 }

/** Fires at every cell of every ship of `board`. */
function sinkEverything(board) {
  return board.ships
    .flatMap((ship) => ship.cells)
    .reduce((acc, cell) => fireAt(acc, cell.row, cell.col).board, board)
}

describe('createBoard', () => {
  it('creates an empty 10x10 board', () => {
    const board = createBoard()
    expect(board.size).toBe(BOARD_SIZE)
    expect(board.ships).toEqual([])
    expect(board.shots).toHaveLength(BOARD_SIZE)
    expect(board.shots.every((line) => line.length === BOARD_SIZE)).toBe(true)
    expect(board.shots.flat().every((value) => value === null)).toBe(true)
  })
})

describe('shipCells', () => {
  it('expands horizontally and vertically', () => {
    expect(shipCells(2, 3, 3, ORIENTATION.HORIZONTAL)).toEqual([
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 2, col: 5 },
    ])
    expect(shipCells(2, 3, 2, ORIENTATION.VERTICAL)).toEqual([
      { row: 2, col: 3 },
      { row: 3, col: 3 },
    ])
  })
})

describe('placement validation', () => {
  it('accepts a placement fully inside the grid', () => {
    expect(canPlaceShip(createBoard(), 0, 0, 5, ORIENTATION.HORIZONTAL)).toBe(true)
    expect(canPlaceShip(createBoard(), 5, 9, 5, ORIENTATION.VERTICAL)).toBe(true)
  })

  it('rejects a placement that leaves the grid', () => {
    const board = createBoard()
    expect(canPlaceShip(board, 0, 6, 5, ORIENTATION.HORIZONTAL)).toBe(false)
    expect(canPlaceShip(board, 6, 0, 5, ORIENTATION.VERTICAL)).toBe(false)
    expect(canPlaceShip(board, -1, 0, 2, ORIENTATION.HORIZONTAL)).toBe(false)
  })

  it('rejects overlapping ships', () => {
    const board = placeShip(createBoard(), cruiser, 4, 4, ORIENTATION.HORIZONTAL)
    expect(canPlaceShip(board, 4, 5, 2, ORIENTATION.VERTICAL)).toBe(false)
    expect(canPlaceShip(board, 3, 5, 2, ORIENTATION.VERTICAL)).toBe(false)
    expect(placeShip(board, destroyer, 4, 4, ORIENTATION.VERTICAL)).toBeNull()
  })

  it('allows a ship next to another one', () => {
    const board = placeShip(createBoard(), cruiser, 4, 4, ORIENTATION.HORIZONTAL)
    expect(canPlaceShip(board, 5, 4, 2, ORIENTATION.HORIZONTAL)).toBe(true)
  })

  it('never places the same ship twice', () => {
    const board = placeShip(createBoard(), cruiser, 0, 0, ORIENTATION.HORIZONTAL)
    expect(placeShip(board, cruiser, 5, 5, ORIENTATION.HORIZONTAL)).toBeNull()
  })

  it('does not mutate the original board', () => {
    const board = createBoard()
    placeShip(board, cruiser, 0, 0, ORIENTATION.HORIZONTAL)
    expect(board.ships).toEqual([])
  })

  it('removes a placed ship', () => {
    const board = placeShip(createBoard(), cruiser, 0, 0, ORIENTATION.HORIZONTAL)
    expect(removeShip(board, 'cruiser').ships).toEqual([])
  })

  it('finds the ship occupying a cell', () => {
    const board = placeShip(createBoard(), cruiser, 1, 1, ORIENTATION.VERTICAL)
    expect(shipAt(board, 2, 1)?.id).toBe('cruiser')
    expect(shipAt(board, 2, 2)).toBeUndefined()
  })
})

describe('placeFleetRandomly', () => {
  it('places the whole fleet without overlaps and inside the grid', () => {
    for (let run = 0; run < 50; run += 1) {
      const board = placeFleetRandomly(createBoard())
      expect(board.ships).toHaveLength(FLEET.length)

      const occupied = new Set()
      for (const ship of board.ships) {
        expect(ship.cells).toHaveLength(ship.size)
        for (const cell of ship.cells) {
          expect(cell.row).toBeGreaterThanOrEqual(0)
          expect(cell.col).toBeGreaterThanOrEqual(0)
          expect(cell.row).toBeLessThan(BOARD_SIZE)
          expect(cell.col).toBeLessThan(BOARD_SIZE)
          const key = `${cell.row},${cell.col}`
          expect(occupied.has(key)).toBe(false)
          occupied.add(key)
        }
      }
      expect(occupied.size).toBe(FLEET.reduce((total, ship) => total + ship.size, 0))
    }
  })

  it('keeps the ship sizes of the standard fleet', () => {
    const board = placeFleetRandomly(createBoard())
    expect(board.ships.map((ship) => ship.size).sort()).toEqual(
      FLEET.map((ship) => ship.size).sort(),
    )
  })
})

describe('fireAt', () => {
  it('reports a miss on open water', () => {
    const { board, result } = fireAt(createBoard(), 0, 0)
    expect(result).toBe(SHOT_RESULT.MISS)
    expect(board.shots[0][0]).toBe('miss')
  })

  it('reports a hit that does not sink the ship', () => {
    const board = placeShip(createBoard(), cruiser, 0, 0, ORIENTATION.HORIZONTAL)
    const { result, ship } = fireAt(board, 0, 1)
    expect(result).toBe(SHOT_RESULT.HIT)
    expect(isShipSunk(ship)).toBe(false)
  })

  it('reports sunk only when every cell of the ship was hit', () => {
    let board = placeShip(createBoard(), destroyer, 3, 3, ORIENTATION.VERTICAL)
    const first = fireAt(board, 3, 3)
    expect(first.result).toBe(SHOT_RESULT.HIT)
    const second = fireAt(first.board, 4, 3)
    expect(second.result).toBe(SHOT_RESULT.SUNK)
    expect(isShipSunk(second.ship)).toBe(true)
    board = second.board
    expect(cellState(board, 3, 3, false)).toBe(CELL.SUNK)
  })

  it('does not mark another ship as sunk', () => {
    let board = placeShip(createBoard(), destroyer, 0, 0, ORIENTATION.HORIZONTAL)
    board = placeShip(board, cruiser, 5, 0, ORIENTATION.HORIZONTAL)
    board = fireAt(board, 0, 0).board
    board = fireAt(board, 0, 1).board
    expect(board.ships.filter(isShipSunk).map((ship) => ship.id)).toEqual(['destroyer'])
  })

  it('rejects repeated shots and shots outside the grid', () => {
    const first = fireAt(createBoard(), 2, 2)
    const repeated = fireAt(first.board, 2, 2)
    expect(repeated.result).toBe(SHOT_RESULT.INVALID)
    expect(repeated.board).toBe(first.board)
    expect(fireAt(createBoard(), 10, 0).result).toBe(SHOT_RESULT.INVALID)
    expect(fireAt(createBoard(), 0, -1).result).toBe(SHOT_RESULT.INVALID)
  })

  it('does not mutate the board it receives', () => {
    const board = placeShip(createBoard(), destroyer, 0, 0, ORIENTATION.HORIZONTAL)
    fireAt(board, 0, 0)
    expect(board.shots[0][0]).toBeNull()
    expect(board.ships[0].hits).toEqual([false, false])
  })

  it('tracks shot cells', () => {
    const { board } = fireAt(createBoard(), 7, 7)
    expect(hasBeenShot(board, 7, 7)).toBe(true)
    expect(hasBeenShot(board, 7, 8)).toBe(false)
  })
})

describe('game over detection', () => {
  it('is false on an empty board', () => {
    expect(isFleetDestroyed(createBoard())).toBe(false)
  })

  it('is false while at least one ship floats', () => {
    let board = placeShip(createBoard(), destroyer, 0, 0, ORIENTATION.HORIZONTAL)
    board = placeShip(board, cruiser, 5, 0, ORIENTATION.HORIZONTAL)
    board = fireAt(board, 0, 0).board
    board = fireAt(board, 0, 1).board
    board = fireAt(board, 5, 0).board
    board = fireAt(board, 5, 1).board
    expect(isFleetDestroyed(board)).toBe(false)
    expect(remainingShips(board).map((ship) => ship.id)).toEqual(['cruiser'])
  })

  it('is true once the whole fleet is sunk', () => {
    const board = sinkEverything(placeFleetRandomly(createBoard()))
    expect(isFleetDestroyed(board)).toBe(true)
    expect(remainingShips(board)).toEqual([])
  })

  it('is not triggered by misses', () => {
    let board = placeShip(createBoard(), destroyer, 0, 0, ORIENTATION.HORIZONTAL)
    board = fireAt(board, 9, 9).board
    board = fireAt(board, 9, 8).board
    expect(isFleetDestroyed(board)).toBe(false)
  })
})

describe('cellState', () => {
  it('hides unharmed ships when they are not revealed', () => {
    const board = placeShip(createBoard(), destroyer, 0, 0, ORIENTATION.HORIZONTAL)
    expect(cellState(board, 0, 0, false)).toBe(CELL.EMPTY)
    expect(cellState(board, 0, 0, true)).toBe(CELL.SHIP)
  })

  it('shows hit, miss and sunk states', () => {
    let board = placeShip(createBoard(), destroyer, 0, 0, ORIENTATION.HORIZONTAL)
    board = fireAt(board, 0, 0).board
    board = fireAt(board, 5, 5).board
    expect(cellState(board, 0, 0, false)).toBe(CELL.HIT)
    expect(cellState(board, 5, 5, false)).toBe(CELL.MISS)
    board = fireAt(board, 0, 1).board
    expect(cellState(board, 0, 1, false)).toBe(CELL.SUNK)
  })
})
