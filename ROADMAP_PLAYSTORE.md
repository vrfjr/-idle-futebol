# Roadmap Play Store e Android - Football Idle

Ultima revisao: 2026-07-05 (noite)

Este arquivo agora vive DENTRO do repo (`pm/ROADMAP_PLAYSTORE.md`) e e versionado no git.
Repo do projeto: https://github.com/vrfjr/-idle-futebol (branch `master`).

Este arquivo e o checklist obrigatorio para publicar e manter o jogo no Android/Google Play sem perder progresso do jogador, sem quebrar anuncios recompensados e sem reprovar por requisitos tecnicos.

## Legenda

- [ ] Pendente
- [~] Em andamento
- [x] Concluido
- [!] Bloqueador antes de publicar

## Referencias oficiais para validar sempre antes do envio

- Target API: https://developer.android.com/google/play/requirements/target-sdk
- Android App Bundle: https://developer.android.com/guide/app-bundle
- Suporte 64-bit: https://developer.android.com/google/play/requirements/64-bit
- Suporte a page size 16 KB: https://developer.android.com/guide/practices/page-sizes
- Data Safety: https://support.google.com/googleplay/android-developer/answer/10787469
- Advertising ID: https://support.google.com/googleplay/android-developer/answer/6048248
- Play Console: https://play.google.com/console

Observacao: requisitos da Play Store mudam. Antes de gerar release final, conferir novamente as paginas oficiais acima.

## Estado atual observado no projeto

- [x] Projeto usa Capacitor em `pm/capacitor.config.ts`.
- [x] Projeto Android existe em `pm/android`.
- [x] `pm/android/variables.gradle` esta com `compileSdkVersion = 36`.
- [x] `pm/android/variables.gradle` esta com `targetSdkVersion = 36`.
- [x] `targetSdkVersion 36` atende ao requisito minimo atual de API 35+.
- [x] `pm/android/app/src/main/AndroidManifest.xml` declara permissao `android.permission.INTERNET`.
- [x] Build web executado com sucesso em 2026-07-05.
- [x] Capacitor sync Android executado com sucesso em 2026-07-05.
- [x] AAB local foi gerado uma vez em `pm/android/app/build/outputs/bundle/release/app-release.aab`.
- [x] AAB regenerado ASSINADO em 2026-07-05 apos build web + cap sync; copia versionada em `releases/football-idle-v1.0.0-1.aab`.
- [x] Inspecao do AAB gerado encontrou `0` bibliotecas nativas `.so`.
- [!] Ainda falta validar build Android real em aparelho fisico.
- [!] Ainda falta testar instalacao via Play Console/teste interno.
- [!] Ainda falta testar 16 KB page size em ambiente real/Play.
- [!] Ainda falta formulario Play Console: Data Safety, anuncios, classificacao etaria e publico-alvo.
- [x] Codigo publicado no GitHub em 2026-07-05 (`vrfjr/-idle-futebol`), incluindo pasta `android/` (antes estava fora do git); keystore e senhas conferidos como NAO versionados.
- [~] Conta de desenvolvedor Google Play criada; aguardando Google validar identidade (nada fica travado enquanto isso — codigo, nome, icone e ficha da loja podem mudar a vontade; so `applicationId` e keystore ficam imutaveis apos o primeiro upload).
- [x] Limpeza de arquivos residuais em 2026-07-05: removidos `claude-skills/` (raiz e pm), `claude-skills.zip`, `projeto_melhorado.zip`, `CLAUDE_CODE_PLAYSTORE.txt` e as copias soltas de roadmap/politica na raiz (versoes canonicas: `pm/ROADMAP_PLAYSTORE.md` e `pm/PRIVACY_POLICY_DRAFT.md`).
- [ ] Pendente de acao externa: `gh auth login` para tornar o repo privado e publicar a politica de privacidade via GitHub Pages; upload do AAB no Play Console apos validacao de identidade.

## Execucao registrada em 2026-07-05

- [x] `npm run build` executado com sucesso.
- [x] `npx cap sync android` executado com sucesso.
- [x] `./gradlew.bat assembleDebug` executado com sucesso uma vez apos liberar rede para o Gradle.
- [x] `./gradlew.bat bundleRelease` executado com sucesso uma vez apos liberar rede para o Gradle.
- [x] AAB local inspecionado: tamanho aproximado 4.4 MB e nenhuma biblioteca `.so`.
- [x] Implementado ganho offline limitado.
- [x] Implementada protecao contra relogio voltando ou saltos absurdos.
- [x] Save passa a gravar `lastSavedAt`.
- [x] Recompensa offline pendente nao fica persistida para nao duplicar.
- [x] Loops de renda passiva, rodada e simulacao visual passam a pausar quando `document.visibilityState` esta `hidden`.
- [x] Botao de recompensa por anuncio direto foi removido da partida; sem SDK, nao ha premio fingindo anuncio.
- [x] Criado rascunho local de politica de privacidade em `PRIVACY_POLICY_DRAFT.md`.
- [x] Criados testes automatizados para ganho offline, reducer/load e storage.
- [!] Android Studio GUI, aparelho real, Play Console, conta de desenvolvedor e URL publica da politica dependem de acao fora deste ambiente.

## Fase 0 - Decisoes obrigatorias antes de publicar

Decisoes tomadas em 2026-07-05 (confirmadas pelo dono do produto):

- [x] Nome final do app: **Idle Football Manager**. Aplicado em `capacitor.config.ts`
  (`appName`), `android/app/src/main/res/values/strings.xml` (`app_name`,
  `title_activity_main`), `public/index.html` (`<title>`) e no header dentro do
  proprio app (`src/App.tsx`).
- [x] Package id final confirmado: `com.vagnerfjr.footballidle` (ja era o valor em
  uso em `capacitor.config.ts` e no projeto Android — so oficializado, sem mudanca
  de codigo).
- [x] Anuncios recompensados no primeiro release: **sim**. Ainda falta escolher o
  SDK (Fase 6) — hoje o jogo mostra "Anuncio recompensado indisponivel nesta
  versao" honestamente, sem SDK integrado.
- [x] Compras internas (IAP) no primeiro release: **sim**. Ainda sem integracao
  real — a tela de Loja hoje so simula a compra de "Remover Anuncios" via toast,
  isso precisa virar uma IAP real antes de publicar (ver pendencia nova abaixo).
- [x] Login/conta/cloud save no primeiro release: **nao**. Save local
  (`localStorage`) apenas, como ja implementado. Simplifica o primeiro release
  (sem backend, sem gerenciamento de conta).
- [ ] Definir funcionamento offline/online:
  - [x] Offline: jogo abre, save local funciona, partida idle funciona, ganho
    offline controlado funciona (verificado ao vivo em 2026-07-05).
  - [ ] Online: anuncios, futuras compras, analiticos e possiveis servicos
    externos funcionam — depende da integracao real dos SDKs (Fase 6/IAP).
  - [x] Sem internet: jogo nao trava, anuncio mostra estado indisponivel,
    recompensa nao e entregue (comportamento atual sem SDK).
- [x] Publico-alvo pretendido no Play Console: **geral / todas as idades**.
- [x] Classificacao etaria esperada: **livre para todos (IARC)** — ainda precisa
  preencher o questionario oficial no Play Console pra confirmar.
- [ ] Definir politica de privacidade antes de ativar anuncios/analytics —
  rascunho existe em `PRIVACY_POLICY_DRAFT.md`, falta publicar em URL acessivel
  e revisar o conteudo contra o SDK de anuncios/IAP que for escolhido.

### Pendencia nova (decorre da decisao de IAP = sim)

- [ ] A tela de Loja (`src/screens/ShopScreen.tsx`) hoje tem um botao "Remover
  Anuncios — R$ 9,90" que so dispara um toast de sucesso sem nenhuma transacao
  real. Com IAP confirmado para o primeiro release, isso precisa virar uma
  compra real via Google Play Billing antes de publicar — do jeito que esta
  hoje, e o mesmo problema que ja foi corrigido pro anuncio recompensado (premio
  fingido sem SDK/callback real).

## Fase 1 - Build Android real

- [x] Rodar build web: `npm run build`.
- [x] Sincronizar Capacitor: `npx cap sync android`.
- [!] Abrir Android Studio: `npx cap open android`.
- [x] Confirmar Gradle sync sem erro.
- [ ] Confirmar app inicia pelo Android Studio.
- [ ] Testar em pelo menos 1 aparelho Android real.
- [ ] Testar em pelo menos 1 emulador limpo.
- [ ] Verificar icone, nome, splash, orientacao retrato e tela cheia.
- [~] Verificar que nenhum botao visivel fica sem funcao.
- [x] Verificar que o app nao depende de servidor local.

## Fase 2 - Geracao de AAB

- [x] Criar keystore de release (2026-07-05: `C:/Users/Degner/keystores/footballidle-release.keystore`, alias `footballidle`, RSA 2048, valido ate 2053).
- [x] Guardar keystore fora do repositorio (pasta `C:/Users/Degner/keystores/`).
- [~] Guardar senha do keystore em local seguro — hoje esta em `C:/Users/Degner/keystores/footballidle-keystore-password.txt`; MOVER para gerenciador de senhas e fazer backup do .keystore em segundo local (nuvem privada/pendrive). Perder o keystore = nao poder atualizar o app.
- [x] Configurar signing de release no Gradle (`android/app/build.gradle` le `android/keystore.properties`, que esta no .gitignore).
- [x] Gerar Android App Bundle assinado (`.aab`) — verificado com jarsigner (`jar verified`) em 2026-07-05.
- [x] Salvar artefato com nome versionado: `releases/football-idle-v1.0.0-1.aab`.
- [ ] Testar instalacao local via bundletool ou teste interno da Play Console.
- [x] Confirmar `versionCode` e `versionName`.
- [ ] Criar regra: todo upload novo deve aumentar `versionCode`.

## Fase 3 - API 35+, 64-bit e 16 KB

- [x] Confirmar `targetSdkVersion >= 35`.
- [x] Confirmar `compileSdkVersion >= 35`.
- [ ] Confirmar compatibilidade Android 15+ no aparelho/emulador.
- [x] Verificar se o AAB/APK contem bibliotecas nativas `.so`.
- [ ] Se houver `.so` 32-bit, garantir equivalente 64-bit:
  - [ ] `armeabi-v7a` deve ter `arm64-v8a`.
  - [ ] `x86` deve ter `x86_64`.
- [ ] Testar em ambiente 64-bit-only quando possivel.
- [x] Verificar dependencias nativas do Capacitor/plugins.
- [~] Validar suporte 16 KB page size para Android 15+.
- [ ] Atualizar dependencias Android/Capacitor se algum plugin bloquear 16 KB.
- [x] Registrar resultado da analise do AAB antes do envio.

## Fase 4 - Save, idle e ganho offline

Objetivo: o jogador nunca deve perder time, liga, elenco, upgrades ou mercado ao fechar o app.

- [x] Criar testes automatizados para salvar/carregar `GameState`.
- [x] Validar persistencia de:
  - [x] moedas;
  - [x] diamantes;
  - [x] nome do clube;
  - [x] cor do clube;
  - [x] elenco;
  - [x] titulares;
  - [x] formacao;
  - [x] liga;
  - [x] rodada;
  - [x] tabela;
  - [x] mercado;
  - [x] upgrades.
- [ ] Testar fechar app e abrir novamente.
- [ ] Testar app em background por 1 minuto.
- [ ] Testar app em background por 30 minutos.
- [ ] Testar app fechado por algumas horas.
- [x] Implementar ganho offline com limite maximo.
- [x] Registrar timestamp de saida do app.
- [x] Registrar timestamp de retorno do app.
- [x] Calcular ganho offline somente dentro de limite permitido.
- [x] Impedir ganho absurdo por relogio manipulado:
  - [x] bloquear delta negativo;
  - [x] limitar delta maximo;
  - [x] detectar saltos grandes suspeitos;
  - [x] nao multiplicar ganho offline varias vezes no mesmo retorno.
- [x] Manter mercado consistente apos retorno.
- [ ] Garantir que compra/venda de jogador nao duplique item apos save/load.
- [ ] Garantir que progressao de liga nao rode varias vezes ao voltar do background.
- [x] Criar tela/mensagem simples de "ganhos enquanto esteve fora" quando existir ganho offline.

## Fase 5 - Background, performance e bateria

Observacao: hoje a partida visual usa Pixi/canvas. Se Three.js for introduzido no futuro, aplicar as mesmas regras de pausa ao renderer 3D.

- [x] Pausar loop visual quando app sair de foco/background.
- [x] Pausar Pixi/canvas quando tela de partida nao estiver visivel.
- [ ] Se Three.js for adicionado, pausar renderer e animation frame quando necessario.
- [x] Evitar `setInterval` ativo desnecessario em background.
- [x] Garantir autosave ao receber evento de background.
- [ ] Garantir retorno sem tela preta.
- [ ] Garantir retorno sem duplicar loop de partida.
- [ ] Medir uso de CPU durante partida.
- [ ] Testar 10 minutos de partida em aparelho fraco.
- [ ] Testar 30 minutos de idle com tela ligada.
- [ ] Testar app bloqueado/desbloqueado.
- [ ] Testar troca rapida entre apps.
- [ ] Verificar memoria apos varias entradas/saidas da tela de partida.
- [ ] Corrigir vazamento de canvas, textura ou listener se aparecer.

## Fase 6 - Anuncio recompensado

Objetivo: recompensa so pode acontecer quando o SDK confirmar que o anuncio recompensado foi concluido.

- [ ] Escolher SDK de anuncios.
- [ ] Confirmar se o SDK esta listado/aceito no Google Play SDK Index.
- [ ] Declarar uso de anuncios no Play Console.
- [ ] Declarar Advertising ID se o SDK usar.
- [ ] Atualizar politica de privacidade com anuncios e SDKs.
- [ ] Atualizar Data Safety com coleta/compartilhamento do SDK.
- [x] Implementar estado "anuncio indisponivel".
- [ ] Implementar estado "carregando anuncio".
- [ ] Implementar estado "usuario fechou anuncio".
- [ ] Implementar estado "recompensa confirmada".
- [~] Entregar recompensa somente no callback oficial de reward.
  - [x] Nesta versao, nenhuma recompensa de anuncio e entregue sem SDK/callback.
  - [ ] Quando SDK for integrado, entregar premio somente no callback oficial.
- [ ] Impedir recompensa duplicada:
  - [ ] bloquear clique enquanto anuncio esta aberto;
  - [ ] gerar id unico por tentativa;
  - [ ] marcar tentativa como consumida;
  - [ ] ignorar segundo callback da mesma tentativa.
- [ ] Se usuario fechar anuncio antes da confirmacao, nao entregar recompensa.
- [~] Se estiver sem internet, nao travar jogo.
- [ ] Se SDK falhar, mostrar feedback e liberar a UI.
- [ ] Testar anuncio em modo teste.
- [ ] Testar retorno do app depois do anuncio.
- [ ] Testar fechar anuncio cedo.
- [ ] Testar clicar varias vezes no botao de anuncio.
- [ ] Testar sem internet.
- [ ] Testar internet instavel.

## Fase 7 - Play Console e conformidade

- [ ] Criar/verificar conta de desenvolvedor Google Play.
- [ ] Verificar requisitos atuais da conta:
  - [ ] identidade;
  - [ ] pagamento/taxa;
  - [ ] perfil de pagamentos;
  - [ ] dados de contato;
  - [ ] possiveis requisitos de teste fechado antes de producao.
- [ ] Criar app no Play Console.
- [ ] Categoria: Jogos.
- [ ] Genero inicial sugerido: Esportes ou Simulacao/Casual, validar no Console.
- [ ] Preencher titulo curto.
- [ ] Preencher descricao curta.
- [ ] Preencher descricao completa.
- [ ] Adicionar icone 512x512.
- [ ] Adicionar feature graphic.
- [ ] Adicionar screenshots de celular.
- [ ] Declarar anuncios.
- [ ] Preencher Data Safety.
- [~] Publicar politica de privacidade em URL acessivel.
- [ ] Preencher classificacao etaria.
- [ ] Preencher publico-alvo.
- [ ] Preencher conteudo do app.
- [ ] Preencher coleta de dados.
- [ ] Preencher permissao `INTERNET` com justificativa real se exigido.
- [~] Revisar se ha botoes de compra/anuncio/funcoes nao implementadas.
- [ ] Enviar primeiro para teste interno.
- [ ] Testar instalacao pelo link do Play Internal Testing.
- [ ] Depois enviar para teste fechado/aberto conforme exigencia da conta.
- [ ] So enviar para producao apos checklist de save, anuncios e bateria.

## Fase 8 - Testes obrigatorios em Android real

Criar uma planilha simples de dispositivos testados antes de publicar.

- [ ] Aparelho fraco Android 10/11 ou similar.
- [ ] Aparelho medio Android 13/14.
- [ ] Aparelho Android 15+.
- [ ] Aparelho 64-bit-only, se disponivel.
- [ ] Teste com internet Wi-Fi.
- [ ] Teste com internet movel.
- [ ] Teste sem internet.
- [ ] Teste em modo aviao.
- [ ] Teste fechando o app pelo gerenciador.
- [ ] Teste bloqueando/desbloqueando tela.
- [ ] Teste depois de app ficar em background.
- [ ] Teste de compra/venda/escalacao antes e depois de fechar.
- [ ] Teste de liga/tabela antes e depois de fechar.
- [ ] Teste de upgrades antes e depois de fechar.
- [ ] Teste de anuncio recompensado concluido.
- [ ] Teste de anuncio fechado cedo.
- [ ] Teste de anuncio indisponivel.

## Fase 9 - Criterios de aceite para publicar

Nao publicar se algum item abaixo falhar.

- [ ] AAB assinado gerado sem erro.
- [ ] `targetSdkVersion >= 35`.
- [ ] Compatibilidade 64-bit validada.
- [ ] Compatibilidade 16 KB validada ou risco documentado e corrigido.
- [ ] App abre offline.
- [ ] App abre online.
- [ ] Sem travamento ao voltar do background.
- [ ] Sem perda de save apos fechar app.
- [ ] Sem perda de time, liga, elenco, mercado ou upgrades.
- [ ] Ganho offline limitado e protegido contra relogio manipulado.
- [ ] Nenhum botao visivel sem funcao.
- [ ] Anuncio recompensado entrega premio somente apos confirmacao.
- [ ] Anuncio indisponivel nao trava o jogo.
- [ ] Data Safety preenchido de acordo com SDKs reais.
- [ ] Politica de privacidade publicada e coerente com o app.
- [ ] Classificacao etaria preenchida.
- [ ] Publico-alvo preenchido.
- [ ] Teste interno pelo Play Console instalado em aparelho real.

## Fase 10 - Ordem recomendada

1. Fechar save robusto e ganho offline seguro.
2. Pausar loops em background e reduzir bateria.
3. Criar testes automatizados de reducer/storage/idle offline.
4. Validar Android build local.
5. Gerar AAB assinado.
6. Validar API 35+, 64-bit e 16 KB.
7. Integrar anuncio recompensado com callbacks corretos.
8. Atualizar politica de privacidade e Data Safety com os SDKs reais.
9. Testar em aparelhos reais.
10. Enviar para teste interno no Play Console.
11. Corrigir problemas encontrados no teste interno.
12. So entao preparar producao.

## Riscos principais

- Save baseado apenas em `localStorage` pode ser suficiente para o primeiro release, mas precisa ser testado em WebView Android real.
- Ganho offline sem limite pode quebrar economia do idle.
- Relogio do aparelho manipulado pode gerar moedas absurdas se nao houver trava.
- Anuncio recompensado mal integrado pode duplicar premio ou premiar usuario que fechou o anuncio.
- SDK de anuncios muda Data Safety, Advertising ID e politica de privacidade.
- Loops visuais ativos em background podem drenar bateria.
- Canvas/Pixi mal destruido pode acumular memoria ao trocar de tela.
- AAB pode compilar, mas ainda falhar em 64-bit/16 KB por plugin nativo.
- Play Console pode exigir etapas adicionais da conta antes de producao.

## Registro de verificacoes

Adicionar uma linha a cada preparacao de release.

| Data | Versao | Build | Aparelhos | Resultado | Observacoes |
|------|--------|-------|-----------|-----------|-------------|
| 2026-07-05 | 1.0.0-dev | web build | navegador local | OK | Checklist inicial criado. |
| 2026-07-05 | 1.0.0-dev | web + cap sync + AAB parcial | sem aparelho real | Parcial | Build web, sync Android, testes automatizados e AAB local executados; AAB precisa ser regenerado apos ultima sync quando Gradle tiver rede liberada. |
| 2026-07-05 | 1.0.0 (versionCode 1) | AAB assinado | sem aparelho real | OK | Keystore de release criado fora do repo, signing configurado via keystore.properties (gitignored), `bundleRelease` gerou AAB assinado (4.4 MB, jarsigner: jar verified, cert valido ate 2053). Copia versionada em `releases/football-idle-v1.0.0-1.aab`. Typecheck + 19 testes (8 suites) passando antes do build. Pronto para upload no Play Console teste interno. |
| 2026-07-05 | 1.0.0-dev | web build (navegador) | navegador local | OK | Verificado ao vivo (nao so lido): ganho offline calcula e credita corretamente uma unica vez, sem duplicar em reload imediato; loops de partida/renda/rodada pausam com `visibilitychange`; botao de anuncio fake removido, mensagem honesta no lugar; `npm test` roda 3 suites/8 testes, todos passando. Decisoes da Fase 0 confirmadas com o dono do produto e aplicadas: nome "Idle Football Manager", package id oficializado, ads+IAP no primeiro release, sem cloud save, publico geral/livre. Pendencia nova registrada: botao "Remover Anuncios" da Loja ainda simula a compra sem IAP real. |
