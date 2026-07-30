import { BOARD_SIZE, CELL, FLEET, ORIENTATION, SHOT_RESULT } from './constants.js'

/**
 * A board is an immutable-ish plain object:
 * {
 *   size: number,
 *   ships: [{ id, size, orientation, cells: [{row, col}], hits: boolean[] }],
 *   shots: (null | 'miss' | 'hit')[][]
 * }
 */
export function createBoard(size = BOARD_SIZE) {
  return {
    size,
    ships: [],
    shots: Array.from({ length: size }, () => Array.from({ length: size }, () => null)),
  }
}

export function isInsideBoard(board, row, col) {
  return row >= 0 && col >= 0 && row < board.size && col < board.size
}

/** Cells a ship of `size` would occupy starting at (row, col) with `orientation`. */
export function shipCells(row, col, size, orientation) {
  return Array.from({ length: size }, (_, i) =>
    orientation === ORIENTATION.VERTICAL
      ? { row: row + i, col }
      : { row, col: col + i },
  )
}

export function shipAt(board, row, col) {
  return board.ships.find((ship) =>
    ship.cells.some((cell) => cell.row === row && cell.col === col),
  )
}

export function isShipSunk(ship) {
  return ship.hits.every(Boolean)
}

/** True when every ship of the fleet is placed and fully hit. */
export function isFleetDestroyed(board) {
  return board.ships.length > 0 && board.ships.every(isShipSunk)
}

export function remainingShips(board) {
  return board.ships.filter((ship) => !isShipSunk(ship))
}

/** Placement is valid if it stays inside the grid and does not overlap another ship. */
export function canPlaceShip(board, row, col, size, orientation) {
  const cells = shipCells(row, col, size, orientation)
  return cells.every(
    (cell) => isInsideBoard(board, cell.row, cell.col) && !shipAt(board, cell.row, cell.col),
  )
}

/** Returns a new board with the ship placed, or `null` when the placement is invalid. */
export function placeShip(board, shipDef, row, col, orientation) {
  if (board.ships.some((ship) => ship.id === shipDef.id)) return null
  if (!canPlaceShip(board, row, col, shipDef.size, orientation)) return null

  const ship = {
    id: shipDef.id,
    size: shipDef.size,
    orientation,
    cells: shipCells(row, col, shipDef.size, orientation),
    hits: Array.from({ length: shipDef.size }, () => false),
  }

  return { ...board, ships: [...board.ships, ship] }
}

export function removeShip(board, shipId) {
  return { ...board, ships: board.ships.filter((ship) => ship.id !== shipId) }
}

/** Places the whole fleet at random. Never mutates `board`. */
export function placeFleetRandomly(board, fleet = FLEET, random = Math.random) {
  const orientations = [ORIENTATION.HORIZONTAL, ORIENTATION.VERTICAL]
  let attempts = 0

  while (attempts < 100) {
    attempts += 1
    let next = { ...board, ships: [...board.ships] }
    let placedAll = true

    for (const shipDef of fleet) {
      const options = []
      for (const orientation of orientations) {
        for (let row = 0; row < next.size; row += 1) {
          for (let col = 0; col < next.size; col += 1) {
            if (canPlaceShip(next, row, col, shipDef.size, orientation)) {
              options.push({ row, col, orientation })
            }
          }
        }
      }
      if (options.length === 0) {
        placedAll = false
        break
      }
      const pick = options[Math.floor(random() * options.length)]
      next = placeShip(next, shipDef, pick.row, pick.col, pick.orientation)
    }

    if (placedAll) return next
  }

  throw new Error('Could not place the fleet randomly')
}

export function hasBeenShot(board, row, col) {
  return isInsideBoard(board, row, col) && board.shots[row][col] !== null
}

/**
 * Fires at (row, col). Returns `{ board, result, ship }`.
 * `result` is one of SHOT_RESULT. Shooting outside the grid or repeating a shot
 * yields SHOT_RESULT.INVALID and leaves the board untouched.
 */
export function fireAt(board, row, col) {
  if (!isInsideBoard(board, row, col) || hasBeenShot(board, row, col)) {
    return { board, result: SHOT_RESULT.INVALID, ship: null }
  }

  const target = shipAt(board, row, col)
  const shots = board.shots.map((line, r) =>
    line.map((value, c) => (r === row && c === col ? (target ? 'hit' : 'miss') : value)),
  )

  if (!target) {
    return { board: { ...board, shots }, result: SHOT_RESULT.MISS, ship: null }
  }

  const index = target.cells.findIndex((cell) => cell.row === row && cell.col === col)
  const updatedShip = {
    ...target,
    hits: target.hits.map((hit, i) => (i === index ? true : hit)),
  }
  const ships = board.ships.map((ship) => (ship.id === target.id ? updatedShip : ship))

  return {
    board: { ...board, ships, shots },
    result: isShipSunk(updatedShip) ? SHOT_RESULT.SUNK : SHOT_RESULT.HIT,
    ship: updatedShip,
  }
}

/**
 * Visual state of a cell. `revealShips` shows not-yet-hit ship cells (own board).
 */
export function cellState(board, row, col, revealShips) {
  const shot = board.shots[row][col]
  const ship = shipAt(board, row, col)

  if (shot === 'hit') return ship && isShipSunk(ship) ? CELL.SUNK : CELL.HIT
  if (shot === 'miss') return CELL.MISS
  if (revealShips && ship) return CELL.SHIP
  return CELL.EMPTY
}
