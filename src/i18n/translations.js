export const LANGUAGES = [
  { code: 'pt', label: 'Português', htmlLang: 'pt-BR' },
  { code: 'en', label: 'English', htmlLang: 'en' },
  { code: 'es', label: 'Español', htmlLang: 'es' },
]

export const DEFAULT_LANGUAGE = 'pt'

/**
 * Every language must define exactly the same keys — `translations.test.js`
 * enforces it, so a missing string fails the build instead of the UI.
 * Placeholders use `{name}` and are filled by the translator in ./index.js.
 */
export const translations = {
  pt: {
    'app.title': 'Batalha Naval',
    'app.documentTitle': 'Batalha Naval — Jogador vs IA',
    'app.subtitle': 'Você contra uma IA "hunt / target" — 100% no navegador.',
    'language.label': 'Idioma',

    'setup.intro': 'Posicione sua frota: clique no seu tabuleiro ou use "Posicionar aleatoriamente".',
    'setup.invalid': 'Posição inválida: fora da grade ou sobrepondo outro navio.',
    'setup.placed': '{ship} posicionado. Faltam {remaining} navio(s).',
    'setup.complete': 'Frota completa! Clique em "Iniciar batalha".',
    'setup.random': 'Frota posicionada aleatoriamente. Clique em "Iniciar batalha".',
    'setup.cleared': 'Posicionamento limpo. Posicione sua frota novamente.',

    'controls.rotate': 'Rotacionar ({orientation})',
    'controls.random': 'Posicionar aleatoriamente',
    'controls.clear': 'Limpar posicionamento',
    'controls.start': 'Iniciar batalha',

    'orientation.horizontal': 'horizontal',
    'orientation.vertical': 'vertical',

    'battle.intro': 'Sua vez: clique no tabuleiro inimigo para atirar.',
    'battle.alreadyShot': 'Você já atirou nessa célula. Escolha outra.',
    'turn.player': 'Sua vez',
    'turn.ai': 'Vez da IA...',

    'actor.player': 'Você',
    'actor.ai': 'A IA',
    'shot.miss': '{actor} atirou na água.',
    'shot.hit': '{actor} acertou um navio!',
    'shot.sunk': '{actor} afundou o {ship}!',

    'board.setupTitle': 'Sua frota',
    'board.playerTitle': 'Sua frota ({count} navios vivos)',
    'board.enemyTitle': 'Frota inimiga ({count} navios vivos)',
    'fleet.sunk': 'afundado',

    'gameOver.win': 'Vitória! Você afundou a frota inimiga.',
    'gameOver.lose': 'Derrota. A IA afundou sua frota.',
    'gameOver.playAgain': 'Jogar novamente',

    'ship.carrier': 'Porta-aviões',
    'ship.battleship': 'Encouraçado',
    'ship.cruiser': 'Cruzador',
    'ship.submarine': 'Submarino',
    'ship.destroyer': 'Destroier',

    'cell.empty': 'vazio',
    'cell.ship': 'navio',
    'cell.miss': 'água',
    'cell.hit': 'acerto',
    'cell.sunk': 'afundado',
  },

  en: {
    'app.title': 'Battleship',
    'app.documentTitle': 'Battleship — Player vs AI',
    'app.subtitle': 'You against a "hunt / target" AI — 100% in the browser.',
    'language.label': 'Language',

    'setup.intro': 'Place your fleet: click your board or use "Place randomly".',
    'setup.invalid': 'Invalid position: outside the grid or overlapping another ship.',
    'setup.placed': '{ship} placed. {remaining} ship(s) to go.',
    'setup.complete': 'Fleet complete! Click "Start battle".',
    'setup.random': 'Fleet placed randomly. Click "Start battle".',
    'setup.cleared': 'Placement cleared. Place your fleet again.',

    'controls.rotate': 'Rotate ({orientation})',
    'controls.random': 'Place randomly',
    'controls.clear': 'Clear placement',
    'controls.start': 'Start battle',

    'orientation.horizontal': 'horizontal',
    'orientation.vertical': 'vertical',

    'battle.intro': 'Your turn: click the enemy board to fire.',
    'battle.alreadyShot': 'You already fired at that cell. Pick another one.',
    'turn.player': 'Your turn',
    'turn.ai': "AI's turn...",

    'actor.player': 'You',
    'actor.ai': 'The AI',
    'shot.miss': '{actor} missed.',
    'shot.hit': '{actor} hit a ship!',
    'shot.sunk': '{actor} sank the {ship}!',

    'board.setupTitle': 'Your fleet',
    'board.playerTitle': 'Your fleet ({count} ships afloat)',
    'board.enemyTitle': 'Enemy fleet ({count} ships afloat)',
    'fleet.sunk': 'sunk',

    'gameOver.win': 'Victory! You sank the enemy fleet.',
    'gameOver.lose': 'Defeat. The AI sank your fleet.',
    'gameOver.playAgain': 'Play again',

    'ship.carrier': 'Carrier',
    'ship.battleship': 'Battleship',
    'ship.cruiser': 'Cruiser',
    'ship.submarine': 'Submarine',
    'ship.destroyer': 'Destroyer',

    'cell.empty': 'empty',
    'cell.ship': 'ship',
    'cell.miss': 'miss',
    'cell.hit': 'hit',
    'cell.sunk': 'sunk',
  },

  es: {
    'app.title': 'Batalla Naval',
    'app.documentTitle': 'Batalla Naval — Jugador vs IA',
    'app.subtitle': 'Tú contra una IA "hunt / target" — 100% en el navegador.',
    'language.label': 'Idioma',

    'setup.intro': 'Coloca tu flota: haz clic en tu tablero o usa "Colocar aleatoriamente".',
    'setup.invalid': 'Posición inválida: fuera de la cuadrícula o solapando otro barco.',
    'setup.placed': '{ship} colocado. Faltan {remaining} barco(s).',
    'setup.complete': '¡Flota completa! Haz clic en "Iniciar batalla".',
    'setup.random': 'Flota colocada aleatoriamente. Haz clic en "Iniciar batalla".',
    'setup.cleared': 'Colocación borrada. Coloca tu flota de nuevo.',

    'controls.rotate': 'Rotar ({orientation})',
    'controls.random': 'Colocar aleatoriamente',
    'controls.clear': 'Borrar colocación',
    'controls.start': 'Iniciar batalla',

    'orientation.horizontal': 'horizontal',
    'orientation.vertical': 'vertical',

    'battle.intro': 'Tu turno: haz clic en el tablero enemigo para disparar.',
    'battle.alreadyShot': 'Ya disparaste a esa celda. Elige otra.',
    'turn.player': 'Tu turno',
    'turn.ai': 'Turno de la IA...',

    'actor.player': 'Tú',
    'actor.ai': 'La IA',
    'shot.miss': '{actor} disparó al agua.',
    'shot.hit': '¡{actor} acertó a un barco!',
    'shot.sunk': '¡{actor} hundió el {ship}!',

    'board.setupTitle': 'Tu flota',
    'board.playerTitle': 'Tu flota ({count} barcos a flote)',
    'board.enemyTitle': 'Flota enemiga ({count} barcos a flote)',
    'fleet.sunk': 'hundido',

    'gameOver.win': '¡Victoria! Hundiste la flota enemiga.',
    'gameOver.lose': 'Derrota. La IA hundió tu flota.',
    'gameOver.playAgain': 'Jugar de nuevo',

    'ship.carrier': 'Portaaviones',
    'ship.battleship': 'Acorazado',
    'ship.cruiser': 'Crucero',
    'ship.submarine': 'Submarino',
    'ship.destroyer': 'Destructor',

    'cell.empty': 'vacío',
    'cell.ship': 'barco',
    'cell.miss': 'agua',
    'cell.hit': 'acierto',
    'cell.sunk': 'hundido',
  },
}
