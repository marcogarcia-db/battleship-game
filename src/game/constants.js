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

/** Ships carry no display name: the UI translates them from `id` (see src/i18n). */
export const FLEET = [
  { id: 'carrier', size: 5 },
  { id: 'battleship', size: 4 },
  { id: 'cruiser', size: 3 },
  { id: 'submarine', size: 3 },
  { id: 'destroyer', size: 2 },
]
