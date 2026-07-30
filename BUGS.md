# Bugs encontrados e corrigidos

Todos os bugs abaixo foram encontrados de verdade durante o desenvolvimento — nos
testes unitários (Vitest) ou no teste manual/roteirizado do jogo no navegador
(`npm run dev`). Cada item traz o sintoma observado, a causa raiz e a correção.

---

## 1. Tiro do jogador perdido quando dois cliques caem no mesmo lote do React

**Sintoma observado.** Clicando rápido em duas células do tabuleiro inimigo
(A1 e B1, no mesmo tick do navegador), só uma das duas ficava marcada: `A1`
continuava `empty` e apenas `B1` virava `hit`. O jogador gastava dois turnos e
recebia um único tiro.

**Causa raiz.** `handleFire` calculava o novo tabuleiro fora do updater, a partir
do valor de `enemyBoard` capturado no render:

```jsx
const { board, result, ship } = fireAt(enemyBoard, row, col)   // valor do render
setState((prev) => ({ ...prev, enemyBoard: board, turn: 'ai', ... }))
```

Os dois cliques ocorrem antes do próximo render, então ambos leem o **mesmo**
`enemyBoard` antigo. O segundo `setState` sobrescreve o resultado do primeiro, e
o primeiro tiro desaparece. A guarda `if (turn !== 'player') return` também usava
o `turn` do render, por isso não bloqueava o segundo clique.

**Correção.** Todo o cálculo passou para dentro do updater, derivado só de `prev`
— o que torna a transição de turno atômica e faz o segundo clique ser rejeitado:

```jsx
setState((prev) => {
  if (prev.phase !== PHASE.BATTLE || prev.turn !== 'player') return prev
  const { board, result, ship } = fireAt(prev.enemyBoard, row, col)
  ...
})
```

**Verificação.** Três cliques no mesmo tick agora produzem exatamente um tiro
(`A1 miss`, `B1 empty`, `C1 empty`) e um único turno da IA.

---

## 2. Jogo travando em "Vez da IA..." para sempre

**Sintoma observado.** Em uma partida longa no navegador, o jogo parou: o
indicador ficou em `Vez da IA...`, a mensagem em `Você atirou na água.`, os
tabuleiros congelados e nenhum erro no console. A IA nunca mais atirou, e o
tabuleiro do jogador ainda tinha dezenas de células livres (ou seja, não era
falta de alvo).

**Causa raiz.** O turno da IA era agendado por um efeito com dependências
`[phase, turn]`. Quando o `setState` do tiro do jogador é processado no **mesmo
lote** que o `setState` da própria IA, `turn` sai de `'ai'` e volta para `'ai'`
dentro do mesmo commit: o valor entre renders não muda, o efeito não reexecuta e
nenhum novo `setTimeout` é criado. Como a IA só atira dentro desse timeout, o
jogo fica parado esperando um turno que nunca é agendado. (A mensagem final
ser a do jogador, e não a da IA, é justamente a assinatura desse lote conjunto.)

**Correção.** O efeito passou a depender do objeto de estado inteiro, cuja
identidade muda em toda atualização, de modo que o agendamento é reavaliado após
qualquer commit:

```jsx
useEffect(() => {
  if (phase !== PHASE.BATTLE || turn !== 'ai') return undefined
  aiTimer.current = setTimeout(() => { /* tiro da IA */ }, AI_DELAY_MS)
  return () => clearTimeout(aiTimer.current)
}, [state, phase, turn])
```

A correção do bug 1 remove a causa mais comum do lote conjunto; esta torna o
agendamento robusto mesmo se ele acontecer.

**Verificação.** Duas partidas completas roteirizadas até o fim (uma vitória e
uma derrota, ~57 tiros da IA) sem travar em nenhum turno.

---

## 3. Teste da IA descrevia o comportamento errado ("target" após o segundo acerto)

**Sintoma observado.** `npm test` falhava em
`target mode > keeps only the aligned candidates after a second hit`:

```
expected [ { row: 4, col: 3 }, { row: 4, col: 6 } ] to deeply equal [ { row: 4, col: 6 } ]
```

**Causa raiz.** O bug estava no **teste**, não na IA. Depois de dois acertos
alinhados em `(4,4)` e `(4,5)`, existem duas extremidades plausíveis — `(4,3)` e
`(4,6)` — e a IA mantinha as duas, corretamente. A expectativa considerava só
uma extremidade, o que descartaria metade dos alvos válidos e faria a IA perder
tiros em navios que se estendem para o lado "errado".

**Correção.** A expectativa foi ajustada para as duas extremidades alinhadas,
mantendo intacta a lógica de `alignedCandidates`. O teste continua garantindo o
essencial: candidatos fora do eixo do navio são descartados.

---

## 4. Estados da célula sumindo sob o cursor (hover sobrescrevia cor)

**Sintoma observado.** No posicionamento manual, a célula sob o cursor não
mostrava o preview verde/vermelho — ficava azul (cor de hover), então a primeira
célula do navio parecia inválida/vazia. O mesmo acontecia na batalha: passar o
mouse sobre um `•` (água) ou `✕` já atirado escondia a marca.

**Causa raiz.** Especificidade CSS, em **duas** regras de hover diferentes:

1. `.cell:not(:disabled):hover` em `Board.css` (três seletores) vencia
   `.cell--preview-valid` / `.cell--miss` (um seletor), mesmo declarados depois
   no arquivo. Um primeiro conserto (`.cell.cell--preview-valid`) ainda perdia,
   o que foi confirmado lendo o `background` computado da célula:
   `rgb(23, 85, 127)` — o azul do hover.
2. Depois de corrigir a primeira, o teste manual mostrou que a célula sob o
   cursor **continuava** azul: a regra global `button:hover:not(:disabled)` de
   `App.css`, escrita para os botões de controle, também atingia as células
   (que são `<button>`) e vencia as classes de estado.

**Correção.** O hover deixou de pintar fundo de forma genérica. Em `Board.css`
ele só altera o `transform`, e o fundo fica restrito a células realmente vazias:

```css
.cell:not(:disabled):hover { transform: scale(1.06); }

.cell--empty:not(.cell--preview-valid):not(.cell--preview-invalid):not(:disabled):hover {
  background: #17557f;
}
```

E em `App.css` a regra global passou a excluir as células, que cuidam do próprio
hover:

```css
button:not(.cell):hover:not(:disabled) { background: #17557f; }
```

**Verificação.** Preview de 5 células aparece verde inclusive sob o cursor
(célula-âncora incluída), e marcas de água/acerto/afundado permanecem visíveis
ao passar o mouse.

---

## 5. Instrumentação de depuração deixada no componente

**Sintoma observado.** Durante os testes roteirizados no navegador foi adicionada
uma linha que expunha o tabuleiro inimigo no `window` para poder mirar nos navios
(e assim forçar vitória/derrota):

```jsx
if (import.meta.env.DEV) window.__enemy = state.enemyBoard
```

**Problema.** Além de ser efeito colateral dentro do render, vazar a posição da
frota inimiga é exatamente a informação que o jogador não deveria ter.

**Correção.** A linha foi removida após a bateria de testes manuais; nenhuma
informação do tabuleiro inimigo é exposta no build final (o `dist` publicado não
contém `window.__enemy`).
