import { BOARD_SIZE, CELL, cellState } from '../game/index.js'
import './Board.css'

const COLUMN_LABELS = 'ABCDEFGHIJ'.split('')

function isPreviewed(preview, row, col) {
  return preview.cells.some((cell) => cell.row === row && cell.col === col)
}

export default function Board({
  board,
  revealShips = false,
  interactive = false,
  preview = null,
  onCellClick,
  onCellEnter,
  onLeave,
}) {
  const size = board?.size ?? BOARD_SIZE

  return (
    <div className="board" onMouseLeave={onLeave}>
      <div className="board-grid" style={{ '--size': size }}>
        <div className="board-label" />
        {COLUMN_LABELS.slice(0, size).map((label) => (
          <div key={label} className="board-label">
            {label}
          </div>
        ))}

        {Array.from({ length: size }, (_, row) => (
          <div key={row} className="board-row" style={{ display: 'contents' }}>
            <div className="board-label">{row + 1}</div>
            {Array.from({ length: size }, (_, col) => {
              const state = cellState(board, row, col, revealShips)
              const previewClass = preview && isPreviewed(preview, row, col)
                ? preview.valid
                  ? 'cell--preview-valid'
                  : 'cell--preview-invalid'
                : ''

              return (
                <button
                  key={col}
                  type="button"
                  className={`cell cell--${state} ${previewClass}`}
                  disabled={!interactive}
                  aria-label={`${COLUMN_LABELS[col]}${row + 1} ${state}`}
                  onClick={() => onCellClick?.(row, col)}
                  onMouseEnter={() => onCellEnter?.(row, col)}
                >
                  {state === CELL.MISS ? '•' : ''}
                  {state === CELL.HIT || state === CELL.SUNK ? '✕' : ''}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
