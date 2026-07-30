# Batalha Naval (Battleship) — Jogador vs IA

Jogo de Batalha Naval jogável no navegador contra uma IA, 100% client-side (React 18 + Vite).

## Jogar online

**https://marcogarcia-db.github.io/battleship-game/**

Não precisa de login nem de backend: a IA roda no seu navegador.

## Rodar localmente

```bash
npm install
npm run dev      # http://localhost:5173
```

Outros scripts:

```bash
npm test         # testes unitários da lógica do jogo (Vitest)
npm run build    # build de produção em dist/
npm run preview  # serve o build de produção
npm run lint     # ESLint
```

## Regras

- Tabuleiro de 10x10 para cada lado.
- Frota padrão (idêntica para o jogador e para a IA):

  | Navio | Tamanho |
  | --- | --- |
  | Porta-aviões | 5 |
  | Encouraçado | 4 |
  | Cruzador | 3 |
  | Submarino | 3 |
  | Destroier | 2 |

- **Setup:** posicione a frota clicando no seu tabuleiro (o botão *Rotacionar* alterna
  horizontal/vertical), ou use *Posicionar aleatoriamente*. *Limpar posicionamento* recomeça o
  setup. Navios precisam ficar inteiros dentro da grade e não podem se sobrepor; podem ficar
  encostados. A frota da IA é sempre posicionada aleatoriamente.
- **Batalha:** os turnos alternam — um tiro do jogador, um tiro da IA. Clique numa célula do
  tabuleiro inimigo para atirar. Células já atacadas não podem ser reatacadas.
- Cada tiro devolve **água**, **acerto** ou **afundou** (quando todas as células do navio foram
  acertadas).
- Vence quem afundar toda a frota adversária primeiro. O fim de jogo é detectado assim que o
  último navio afunda, e o tabuleiro inimigo é revelado.

### Estados das células

| Cor | Significado |
| --- | --- |
| Azul | água não atacada |
| Cinza | navio seu (só no seu tabuleiro) |
| Azul escuro com `•` | tiro na água |
| Laranja com `✕` | acerto |
| Vermelho com `✕` | navio afundado |
| Verde / vermelho (setup) | pré-visualização de posicionamento válido / inválido |

## A IA

IA "hunt / target" (`src/game/ai.js`):

- **hunt:** tiro aleatório restrito a uma máscara de paridade (`(linha + coluna) % 2 === 0`).
  Como todo navio tem tamanho ≥ 2, ele sempre cobre pelo menos uma célula da máscara — metade
  do tabuleiro basta para encontrar a frota inteira.
- **target:** ao acertar, enfileira as células adjacentes ao acerto. Com dois ou mais acertos no
  mesmo navio, mantém apenas os candidatos alinhados com eles (as duas pontas da linha).
- Ao afundar um navio, a fila é limpa e a IA volta ao modo *hunt*.
- A IA nunca repete um tiro: os candidatos são filtrados contra as células já atacadas.

## Estrutura

```
src/
  game/            lógica pura do jogo, sem dependência de React
    constants.js   tamanho do tabuleiro, frota, enums de célula/resultado
    board.js       criação do tabuleiro, posicionamento, disparo, fim de jogo
    ai.js          IA hunt/target
    *.test.js      35 testes unitários (Vitest)
  components/
    Board.jsx      grade 10x10 com estados visuais e pré-visualização
  App.jsx          máquina de estados: setup -> batalha -> fim de jogo
```

A lógica do jogo é totalmente separada da UI: `src/game/` não importa React e todas as funções
são puras (nunca mutam o tabuleiro recebido), o que torna os testes diretos e evita bugs de
estado compartilhado no React.

## Bugs encontrados e corrigidos

Veja [BUGS.md](./BUGS.md).

## Deploy

Push na branch `main` dispara o workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
que roda os testes, faz `npm run build` e publica `dist/` no GitHub Pages
(Pages configurado com source *GitHub Actions*). O `base` do Vite é `/battleship-game/`.
