export const BOARD_SIZE = 10

export const CELL = {
  EMPTY: 'empty',
  SHIP: 'ship',
  MISS: 'miss',
  HIT: 'hit',
  SUNK: 'sunk',
}

export const ORIENTATION = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
}

export const SHOT_RESULT = {
  INVALID: 'invalid',
  MISS: 'miss',
  HIT: 'hit',
  SUNK: 'sunk',
}

export const FLEET = [
  { id: 'carrier', name: 'Porta-aviões', size: 5 },
  { id: 'battleship', name: 'Encouraçado', size: 4 },
  { id: 'cruiser', name: 'Cruzador', size: 3 },
  { id: 'submarine', name: 'Submarino', size: 3 },
  { id: 'destroyer', name: 'Destroier', size: 2 },
]
