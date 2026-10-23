# Poker Coach (web)

Treino de decisões de poker (NLHE cash, heads-up) com feedback da Bússola e painel de desvios por spot.

## Rodar

    npm install
    npm run dev      # http://localhost:3000
    npm test         # testes da lógica (engine e game)
    npm run build

## Estrutura

- `src/engine`: cartas, avaliador, estado da mão e análise (regras do jogo)
- `src/game`: treino (spots, oponente, Bússola) e estatísticas
- `src/components`, `src/i18n.tsx`: interface e textos (pt/en)

A Bússola usa regras simples de coach. Não é solver nem GTO.
