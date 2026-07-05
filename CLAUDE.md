# Football Idle — notas para trabalhar neste repo

Jogo idle de futebol em React + TypeScript, empacotado como app Android via Capacitor
(WebView nativa, sem lógica nativa própria além dos stubs em `src/services/`).

## Stack e comandos

- React 18 + TypeScript 4.9 (via Create React App / `react-scripts`, **não** Vite/Next).
- Capacitor 8 para empacotar como Android (`npx cap sync`, `npx cap open android`).
- Sem Redux/Zustand — estado global é um `useReducer` + Context simples
  (`src/store/GameContext.tsx` + `src/store/gameReducer.ts`).

Depois de qualquer edição em `src/`, rode nesta ordem:
```
npm run typecheck   # tsc --noEmit
npm run lint        # eslint src --ext .ts,.tsx
npm test            # jest, roda uma vez e sai (não é watch mode)
```
`npm start` sobe o dev server em http://localhost:3000 para testar manualmente no navegador
(o app inteiro roda numa WebView, então o navegador já é uma aproximação fiel do celular).

`npm run test:watch` é o modo interativo do CRA, para quando estiver escrevendo testes.

**Estado atual dos testes (2026-07-05): 8 suites / 19 testes passando** — cobrem reducer,
storage, ganho offline, lineup e matchSim (arquivos `*.test.ts` em `src/`). São testes de
lógica pura via Jest; `@testing-library/react` continua não instalado, então componentes
React não têm teste — instale-o antes de testar componentes.

## Convenções de estilo observadas no código

- Sem espaço depois de `if`/`for`: `if(x < y)`, não `if (x < y)`.
- Estilos são inline via `style={{...}}` nos componentes — não há styled-components nem
  CSS Modules. `index.css` só tem estilos globais mínimos.
- Ações do reducer: constantes string com `as const` + union discriminada `GameAction`
  (ver `src/store/actions.ts`). Ao adicionar uma ação nova, siga esse padrão em vez de
  introduzir outro mecanismo de state (não usar `useState` solto para dados que devem
  persistir no save).
- Comentários de código em inglês; textos de UI (labels, toasts) em português.
- Comentários `// FIX: ...` marcam bugs já corrigidos e por quê — são histórico útil,
  não lixo para limpar. Não remova sem entender o que documentam.
- Persistência: `localStorage` puro via `src/services/storage.ts`, chave versionada
  `football_idle_v1`. Ao mudar o formato de `GameState`, pense em bump de versão da chave
  ou em migração no reducer (`case LOAD`), senão saves antigos quebram silenciosamente.

## Inconsistências conhecidas (não "consertar" sem perguntar)

- `src/services/ads.ts` e `src/services/iap.ts` são stubs cujos comentários referenciam
  APIs do **React Native** (`react-native-google-mobile-ads`, `react-native-iap`), mas o
  projeto empacota via **Capacitor**, não React Native. Os equivalentes reais seriam algo
  como `@capacitor-community/admob` e um plugin de IAP para Capacitor. Ficaram assim de uma
  fase anterior do projeto — não trocar por conta própria sem confirmar com o usuário.
- `playwright` está como devDependency mas não há `playwright.config.*` nem testes E2E.
  Provavelmente foi instalado pensando em testar o fluxo do jogo no navegador antes de
  empacotar para Android, mas nunca foi configurado.
- Projeto ainda não tem git inicializado (`E:\Projetos\idle futebol` não é repositório).
  Sem git, revisar diffs e voltar atrás em mudanças é muito mais difícil — vale considerar
  `git init` antes de sessões de edição maiores.

## Como trabalhar aqui (preferências do usuário)

- Mudanças pequenas e incrementais. Evitar sessões gigantes que tocam muitos arquivos de
  uma vez — preferir iterar em passos revisáveis.
- Sempre rodar `typecheck` + `lint` + `test` depois de editar, não só confiar em "parece certo".
- Este arquivo deve ser atualizado sempre que uma decisão ou convenção documentada aqui
  se mostrar errada ou desatualizada — não deixar o CLAUDE.md ficar obsoleto.
