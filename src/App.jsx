import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Board from './components/Board.jsx'
import {
  FLEET,
  ORIENTATION,
  SHOT_RESULT,
  canPlaceShip,
  createAI,
  createBoard,
  fireAt,
  isFleetDestroyed,
  isShipSunk,
  nextShot,
  placeFleetRandomly,
  placeShip,
  registerResult,
  remainingShips,
  shipCells,
} from './game/index.js'
import { LANGUAGES } from './i18n/index.js'
import { useTranslation } from './i18n/LanguageProvider.jsx'
import './App.css'

const PHASE = { SETUP: 'setup', BATTLE: 'battle', OVER: 'over' }
const AI_DELAY_MS = 650

function initialState() {
  return {
    phase: PHASE.SETUP,
    playerBoard: createBoard(),
    enemyBoard: placeFleetRandomly(createBoard()),
    ai: createAI(),
    turn: 'player',
    winner: null,
    // Messages are stored as a key + params, never as a rendered string, so
    // switching the language also re-translates the message already on screen.
    message: { key: 'setup.intro' },
  }
}

export default function App() {
  const { t, language, setLanguage } = useTranslation()
  const [state, setState] = useState(initialState)
  const [orientation, setOrientation] = useState(ORIENTATION.HORIZONTAL)
  const [hover, setHover] = useState(null)
  const aiTimer = useRef(null)

  const { phase, playerBoard, enemyBoard, turn, winner, message } = state

  const nextShipToPlace = useMemo(
    () => FLEET.find((ship) => !playerBoard.ships.some((placed) => placed.id === ship.id)) ?? null,
    [playerBoard],
  )

  const preview = useMemo(() => {
    if (phase !== PHASE.SETUP || !hover || !nextShipToPlace) return null
    return {
      cells: shipCells(hover.row, hover.col, nextShipToPlace.size, orientation),
      valid: canPlaceShip(playerBoard, hover.row, hover.col, nextShipToPlace.size, orientation),
    }
  }, [phase, hover, nextShipToPlace, orientation, playerBoard])

  useEffect(() => () => clearTimeout(aiTimer.current), [])

  const reset = useCallback(() => {
    clearTimeout(aiTimer.current)
    setState(initialState())
    setHover(null)
    setOrientation(ORIENTATION.HORIZONTAL)
  }, [])

  function handlePlaceShip(row, col) {
    if (phase !== PHASE.SETUP || !nextShipToPlace) return
    const board = placeShip(playerBoard, nextShipToPlace, row, col, orientation)
    if (!board) {
      setState((prev) => ({ ...prev, message: { key: 'setup.invalid' } }))
      return
    }
    const remaining = FLEET.length - board.ships.length
    setState((prev) => ({
      ...prev,
      playerBoard: board,
      message: remaining > 0
        ? { key: 'setup.placed', params: { ship: shipNameKey(nextShipToPlace.id), remaining } }
        : { key: 'setup.complete' },
    }))
  }

  function handleRandomFleet() {
    if (phase !== PHASE.SETUP) return
    setState((prev) => ({
      ...prev,
      playerBoard: placeFleetRandomly(createBoard()),
      message: { key: 'setup.random' },
    }))
  }

  function handleClearFleet() {
    if (phase !== PHASE.SETUP) return
    setState((prev) => ({
      ...prev,
      playerBoard: createBoard(),
      message: { key: 'setup.cleared' },
    }))
  }

  function handleStartBattle() {
    if (playerBoard.ships.length !== FLEET.length) return
    setState((prev) => ({
      ...prev,
      phase: PHASE.BATTLE,
      turn: 'player',
      message: { key: 'battle.intro' },
    }))
    setHover(null)
  }

  function handleFire(row, col) {
    // Everything is derived from `prev` so that two clicks landing in the same
    // React batch cannot fire against a stale board or steal the AI's turn.
    setState((prev) => {
      if (prev.phase !== PHASE.BATTLE || prev.turn !== 'player') return prev

      const { board, result, ship } = fireAt(prev.enemyBoard, row, col)
      if (result === SHOT_RESULT.INVALID) {
        return { ...prev, message: { key: 'battle.alreadyShot' } }
      }

      const enemyDefeated = isFleetDestroyed(board)
      return {
        ...prev,
        enemyBoard: board,
        turn: enemyDefeated ? prev.turn : 'ai',
        phase: enemyDefeated ? PHASE.OVER : prev.phase,
        winner: enemyDefeated ? 'player' : null,
        message: describeShot('actor.player', result, ship),
      }
    })
  }

  // Depends on the whole state object: a shot that lands in the same batch as the
  // AI's own update leaves `turn` unchanged between renders, and an effect keyed
  // only on `turn` would never re-run — freezing the game on the AI's turn.
  useEffect(() => {
    if (phase !== PHASE.BATTLE || turn !== 'ai') return undefined

    aiTimer.current = setTimeout(() => {
      setState((prev) => {
        if (prev.phase !== PHASE.BATTLE || prev.turn !== 'ai') return prev
        const shot = nextShot(prev.ai, prev.playerBoard)
        if (!shot) return { ...prev, turn: 'player' }

        const { board, result, ship } = fireAt(prev.playerBoard, shot.row, shot.col)
        const playerDefeated = isFleetDestroyed(board)
        return {
          ...prev,
          playerBoard: board,
          ai: registerResult(prev.ai, shot, result, board),
          turn: playerDefeated ? prev.turn : 'player',
          phase: playerDefeated ? PHASE.OVER : prev.phase,
          winner: playerDefeated ? 'ai' : null,
          message: describeShot('actor.ai', result, ship),
        }
      })
    }, AI_DELAY_MS)

    return () => clearTimeout(aiTimer.current)
  }, [state, phase, turn])

  return (
    <div className="app">
      <header className="app-header">
        <LanguageSwitcher language={language} onChange={setLanguage} label={t('language.label')} />
        <h1>{t('app.title')}</h1>
        <p className="app-subtitle">{t('app.subtitle')}</p>
      </header>

      <p className="status" role="status">{t(message.key, translateParams(t, message.params))}</p>

      {phase === PHASE.SETUP && (
        <section className="panel">
          <div className="controls">
            <button type="button" onClick={() => setOrientation(
              orientation === ORIENTATION.HORIZONTAL ? ORIENTATION.VERTICAL : ORIENTATION.HORIZONTAL,
            )}>
              {t('controls.rotate', { orientation: t(`orientation.${orientation}`) })}
            </button>
            <button type="button" onClick={handleRandomFleet}>{t('controls.random')}</button>
            <button type="button" onClick={handleClearFleet}>{t('controls.clear')}</button>
            <button
              type="button"
              className="primary"
              disabled={playerBoard.ships.length !== FLEET.length}
              onClick={handleStartBattle}
            >
              {t('controls.start')}
            </button>
          </div>

          <ul className="fleet-list">
            {FLEET.map((ship) => {
              const placed = playerBoard.ships.some((item) => item.id === ship.id)
              const isNext = nextShipToPlace?.id === ship.id
              return (
                <li key={ship.id} className={`fleet-item${placed ? ' fleet-item--placed' : ''}${isNext ? ' fleet-item--next' : ''}`}>
                  {t(shipNameKey(ship.id))} ({ship.size}) {placed ? '✓' : ''}
                </li>
              )
            })}
          </ul>

          <div className="boards">
            <div className="board-wrapper">
              <h2>{t('board.setupTitle')}</h2>
              <Board
                board={playerBoard}
                revealShips
                interactive={Boolean(nextShipToPlace)}
                preview={preview}
                onCellClick={handlePlaceShip}
                onCellEnter={(row, col) => setHover({ row, col })}
                onLeave={() => setHover(null)}
              />
            </div>
          </div>
        </section>
      )}

      {phase !== PHASE.SETUP && (
        <section className="panel">
          {phase === PHASE.BATTLE && (
            <p className="turn">{turn === 'player' ? t('turn.player') : t('turn.ai')}</p>
          )}

          <div className="boards">
            <div className="board-wrapper">
              <h2>{t('board.playerTitle', { count: remainingShips(playerBoard).length })}</h2>
              <Board board={playerBoard} revealShips />
              <FleetStatus board={playerBoard} />
            </div>
            <div className="board-wrapper">
              <h2>{t('board.enemyTitle', { count: remainingShips(enemyBoard).length })}</h2>
              <Board
                board={enemyBoard}
                revealShips={phase === PHASE.OVER}
                interactive={phase === PHASE.BATTLE && turn === 'player'}
                onCellClick={handleFire}
              />
              <FleetStatus board={enemyBoard} />
            </div>
          </div>
        </section>
      )}

      {phase === PHASE.OVER && (
        <section className="game-over">
          <h2>{winner === 'player' ? t('gameOver.win') : t('gameOver.lose')}</h2>
          <button type="button" className="primary" onClick={reset}>{t('gameOver.playAgain')}</button>
        </section>
      )}
    </div>
  )
}

function LanguageSwitcher({ language, onChange, label }) {
  return (
    <div className="language-switcher" role="group" aria-label={label}>
      {LANGUAGES.map(({ code, label: name }) => (
        <button
          key={code}
          type="button"
          className={`language-button${code === language ? ' language-button--active' : ''}`}
          aria-pressed={code === language}
          onClick={() => onChange(code)}
        >
          {name}
        </button>
      ))}
    </div>
  )
}

function FleetStatus({ board }) {
  const { t } = useTranslation()
  return (
    <ul className="fleet-status">
      {board.ships.map((ship) => (
        <li key={ship.id} className={isShipSunk(ship) ? 'sunk' : ''}>
          {t(shipNameKey(ship.id))} ({ship.size}) {isShipSunk(ship) ? `— ${t('fleet.sunk')}` : ''}
        </li>
      ))}
    </ul>
  )
}

function shipNameKey(shipId) {
  return `ship.${shipId}`
}

/** Params can themselves be translation keys (ship names, actors). */
function translateParams(t, params) {
  if (!params) return undefined
  return Object.fromEntries(Object.entries(params).map(([name, value]) => [
    name,
    typeof value === 'string' && (value.startsWith('ship.') || value.startsWith('actor.'))
      ? t(value)
      : value,
  ]))
}

function describeShot(actorKey, result, ship) {
  if (result === SHOT_RESULT.MISS) return { key: 'shot.miss', params: { actor: actorKey } }
  if (result === SHOT_RESULT.SUNK) {
    return { key: 'shot.sunk', params: { actor: actorKey, ship: shipNameKey(ship.id) } }
  }
  return { key: 'shot.hit', params: { actor: actorKey } }
}
