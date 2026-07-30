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
    message: 'Posicione sua frota: clique no seu tabuleiro ou use "Posicionar aleatoriamente".',
  }
}

export default function App() {
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
      setState((prev) => ({ ...prev, message: 'Posição inválida: fora da grade ou sobrepondo outro navio.' }))
      return
    }
    const remaining = FLEET.length - board.ships.length
    setState((prev) => ({
      ...prev,
      playerBoard: board,
      message: remaining > 0
        ? `${nextShipToPlace.name} posicionado. Faltam ${remaining} navio(s).`
        : 'Frota completa! Clique em "Iniciar batalha".',
    }))
  }

  function handleRandomFleet() {
    if (phase !== PHASE.SETUP) return
    setState((prev) => ({
      ...prev,
      playerBoard: placeFleetRandomly(createBoard()),
      message: 'Frota posicionada aleatoriamente. Clique em "Iniciar batalha".',
    }))
  }

  function handleClearFleet() {
    if (phase !== PHASE.SETUP) return
    setState((prev) => ({
      ...prev,
      playerBoard: createBoard(),
      message: 'Posicionamento limpo. Posicione sua frota novamente.',
    }))
  }

  function handleStartBattle() {
    if (playerBoard.ships.length !== FLEET.length) return
    setState((prev) => ({
      ...prev,
      phase: PHASE.BATTLE,
      turn: 'player',
      message: 'Sua vez: clique no tabuleiro inimigo para atirar.',
    }))
    setHover(null)
  }

  function handleFire(row, col) {
    if (phase !== PHASE.BATTLE || turn !== 'player') return
    const { board, result, ship } = fireAt(enemyBoard, row, col)
    if (result === SHOT_RESULT.INVALID) {
      setState((prev) => ({ ...prev, message: 'Você já atirou nessa célula. Escolha outra.' }))
      return
    }

    const enemyDefeated = isFleetDestroyed(board)
    setState((prev) => ({
      ...prev,
      enemyBoard: board,
      turn: enemyDefeated ? prev.turn : 'ai',
      phase: enemyDefeated ? PHASE.OVER : prev.phase,
      winner: enemyDefeated ? 'player' : null,
      message: describeShot('Você', result, ship),
    }))
  }

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
          message: describeShot('A IA', result, ship),
        }
      })
    }, AI_DELAY_MS)

    return () => clearTimeout(aiTimer.current)
  }, [phase, turn])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Batalha Naval</h1>
        <p className="app-subtitle">Você contra uma IA &quot;hunt / target&quot; — 100% no navegador.</p>
      </header>

      <p className="status" role="status">{message}</p>

      {phase === PHASE.SETUP && (
        <section className="panel">
          <div className="controls">
            <button type="button" onClick={() => setOrientation(
              orientation === ORIENTATION.HORIZONTAL ? ORIENTATION.VERTICAL : ORIENTATION.HORIZONTAL,
            )}>
              Rotacionar ({orientation === ORIENTATION.HORIZONTAL ? 'horizontal' : 'vertical'})
            </button>
            <button type="button" onClick={handleRandomFleet}>Posicionar aleatoriamente</button>
            <button type="button" onClick={handleClearFleet}>Limpar posicionamento</button>
            <button
              type="button"
              className="primary"
              disabled={playerBoard.ships.length !== FLEET.length}
              onClick={handleStartBattle}
            >
              Iniciar batalha
            </button>
          </div>

          <ul className="fleet-list">
            {FLEET.map((ship) => {
              const placed = playerBoard.ships.some((item) => item.id === ship.id)
              const isNext = nextShipToPlace?.id === ship.id
              return (
                <li key={ship.id} className={`fleet-item${placed ? ' fleet-item--placed' : ''}${isNext ? ' fleet-item--next' : ''}`}>
                  {ship.name} ({ship.size}) {placed ? '✓' : ''}
                </li>
              )
            })}
          </ul>

          <div className="boards">
            <div className="board-wrapper">
              <h2>Sua frota</h2>
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
            <p className="turn">{turn === 'player' ? 'Sua vez' : 'Vez da IA...'}</p>
          )}

          <div className="boards">
            <div className="board-wrapper">
              <h2>Sua frota ({remainingShips(playerBoard).length} navios vivos)</h2>
              <Board board={playerBoard} revealShips />
              <FleetStatus board={playerBoard} />
            </div>
            <div className="board-wrapper">
              <h2>Frota inimiga ({remainingShips(enemyBoard).length} navios vivos)</h2>
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
          <h2>{winner === 'player' ? 'Vitória! Você afundou a frota inimiga.' : 'Derrota. A IA afundou sua frota.'}</h2>
          <button type="button" className="primary" onClick={reset}>Jogar novamente</button>
        </section>
      )}
    </div>
  )
}

function FleetStatus({ board }) {
  return (
    <ul className="fleet-status">
      {board.ships.map((ship) => (
        <li key={ship.id} className={isShipSunk(ship) ? 'sunk' : ''}>
          {ship.name} ({ship.size}) {isShipSunk(ship) ? '— afundado' : ''}
        </li>
      ))}
    </ul>
  )
}

function describeShot(actor, result, ship) {
  if (result === SHOT_RESULT.MISS) return `${actor} atirou na água.`
  if (result === SHOT_RESULT.SUNK) return `${actor} afundou o ${ship.name}!`
  return `${actor} acertou um navio!`
}
