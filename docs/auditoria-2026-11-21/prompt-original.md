# Prompt para o GPT 6.2 Astra — Auditoria e evolução do Yokira 2.0

Preparado em 21/11/2026. Copie tudo abaixo desta linha e cole no GPT 6.2 Astra.

---

## 1. Papel e contexto

Você é o orquestrador de uma equipe de agentes de engenharia. O projeto é o **Yokira 2.0**, repositório `AnderHonorato/Yokira-2.0`. A branch `main` contém apenas o README; o código real está na branch **`main-ChatGPT`** e no PR #21 (draft, 26 commits, branch `sol/identidade-login-temas-20261105`). É uma aplicação React/Vinext com backend em Cloudflare (D1, R2), publicada em Sites (`yokira-2-ander.honoratoann.chatgpt.site`) e em preview na Vercel (`yokira-2-preview.vercel.app`).

O que o PR #21 declara existir: catálogo administrável (séries/filmes, gêneros, temporadas, episódios, rascunhos, estreias, fontes R2/URL/HLS/Drive/incorporado), chat global, perfis personalizáveis (capa, moldura, aura, nível/XP, hall de destaques), amizades, bloqueios, privacidade, salas dupla/grupo, login por e-mail/senha e ChatGPT, @ único, 20 conquistas, notificações sociais, auditoria de administração, animações e marca animada, layout até 3440px.

O que o PR declara pendente: episódios e fontes reais no catálogo; gestão global de categorias e editoriais; envio de e-mail para verificação e recuperação de senha; upload de vídeo único limitado a 100 MiB; sincronização de terceiros dependente de API do provedor. O CI estava pendente.

## 2. Como trabalhar (orquestração)

Crie um agente por frente e deixe cada um produzir relatório próprio antes de qualquer alteração: **Estrutura**, **Código**, **Interface**, **Animações e transições**, **Segurança**, **Conta**, **Catálogo/Player**, **Comunidade**, **Performance/SEO/Infra**, **Legal**. Um agente revisor final consolida, remove duplicatas, ordena por impacto e risco e resolve conflitos entre frentes.

Regras:

- Leia o código de verdade. Cada item da lista abaixo é uma **hipótese**: confirme no repositório, marque como **JÁ EXISTE**, **PARCIAL** ou **FALTA**, com caminho do arquivo como evidência. Não afirme nada que não tenha verificado.
- Não altere a branch `main-ChatGPT` diretamente. Trabalhe em novas branches e abra PRs pequenos, um por tema.
- Nunca escreva segredos, tokens ou senhas em código, logs ou documentação. Não simule identidades de produção.
- Preserve a identidade visual atual (marca original, compacidade do perfil, animações já validadas).
- Rode typecheck, lint, testes e build a cada PR. Não afirme aprovação de CI que não rodou.
- Use apenas conteúdo licenciado ou autorizado no catálogo. Metadados (sinopse, capas, elenco) podem vir de APIs públicas como AniList, Jikan ou TMDB, que não fornecem vídeo.

## 3. Entregáveis

1. Relatório de auditoria por frente (achados, evidência, severidade).
2. Tabela das 110 sugestões abaixo com status, esforço (P/M/G) e impacto (baixo/médio/alto).
3. Roadmap em ondas: **Onda 0** segurança urgente, **Onda 1** fundação, **Onda 2** funcionalidades que faltam, **Onda 3** polimento.
4. PRs implementando a Onda 0 e a Onda 1, cada um com testes.

## 4. As 110 sugestões

### A. Estrutura e arquitetura

1. **Consolidar branches.** A `main` só tem README e o código vive em `main-ChatGPT`. Definir uma branch de produção, protegê-la e integrar o PR #21 em partes menores para facilitar revisão e rollback.
2. **Organizar a pasta `versao-sites/`.** Separar app web, servidor/Workers, testes, docs e pacotes compartilhados (por exemplo `apps/web`, `apps/api`, `packages/shared`), com imports claros e sem dependências circulares.
3. **Remover código morto.** Rodar knip/madge/ts-prune para achar arquivos, exports e dependências sem uso, e eliminar o que sobrou das iterações anteriores.
4. **Camadas no servidor.** Em `lib/servidor`, separar rotas, serviços e repositórios D1, para que handlers não montem SQL diretamente e regras de negócio sejam testáveis.
5. **Migrações D1 confiáveis.** Criar script de CI que aplica todas as migrações do zero (até a 0019 e além), verifica o esquema final e documenta o rollback de cada uma.
6. **Variáveis de ambiente validadas.** Criar `.env.example` e validar tudo com zod na inicialização, falhando cedo com mensagem clara quando faltar configuração.
7. **Contratos de API tipados.** Compartilhar schemas zod entre cliente e servidor (ou gerar OpenAPI) para impedir divergência silenciosa de campos.
8. **README e documentação reais.** Escrever README com visão geral, requisitos, setup local, deploy e arquitetura; consolidar `docs/` e `CONTINUAR-COM-OUTRA-IA.md` em um índice navegável.
9. **Decidir o alvo de deploy.** Há Sites (chatgpt.site) e Vercel preview. Documentar a paridade de D1/R2 em cada um, ou eleger um destino principal para evitar comportamentos diferentes.
10. **Convenções de repositório.** Padronizar commits e branches, criar CHANGELOG, templates de PR e issue e organizar as 10 labels existentes.

### B. Código e qualidade

11. **Testes de componentes.** Há 157 testes de backend; adicionar Testing Library para componentes críticos (login, perfil, player, chat, admin).
12. **E2E no CI.** Os 16 casos Chromium rodam localmente; levar para o CI com Playwright, incluir Firefox e WebKit e guardar capturas de falha como artefatos.
13. **TypeScript rigoroso.** Ativar `strict` e `noUncheckedIndexedAccess`, eliminar `any` e `@ts-ignore`, e tratar `null` de consultas D1 explicitamente.
14. **ESLint mais exigente.** Adicionar `jsx-a11y`, regras de hooks e ordem de imports, tratando warnings como erro no CI.
15. **Helper de chunking para D1.** O bug do sino veio de consultas com 106 parâmetros. Criar utilitário único que divide listas em lotes seguros e usá-lo em todo `IN (...)` e em marcações em lote.
16. **Erros padronizados.** Criar classe de erro com código, status e mensagem em português, e formato de resposta JSON único para toda a API.
17. **Logs estruturados.** Incluir request id em toda requisição e enviar logs/erros a Sentry ou Logpush, sem dados pessoais.
18. **Quebrar componentes grandes.** Perfil, admin, chat e catálogo tendem a virar arquivos enormes; dividir em partes menores com limite de linhas e testes por parte.
19. **Reduzir o bundle.** Code splitting por rota, carregamento lazy do painel admin e das partículas, e relatório de tamanho no CI com orçamento máximo.
20. **Camada de dados no cliente.** Padronizar fetch com TanStack Query (cache, retry, invalidação, otimismo) para evitar telas desatualizadas e requisições duplicadas.
21. **Idempotência.** Usar chaves de idempotência em claims, uploads, convites e envio de mensagens para que reenvio por rede ruim não duplique efeitos.
22. **CI completo.** Pipeline com typecheck, lint, testes, build, E2E e `npm audit`, bloqueando merge quando vermelho; resolver o estado pendente do CI do PR #21.

### C. Segurança

23. **URGENTE: segredo detectado.** O GitGuardian apontou uma "Generic Password" em `versao-sites/lib/servidor/validacao-fontes-episodio.ts` (commit `d37de20`). Verificar se é segredo real ou fixture de teste. Se real, revogar e rotacionar, mover para secrets e limpar o histórico; se falso positivo, renomear e marcar como ignorado.
24. **Prevenção de vazamento.** Instalar gitleaks ou ggshield como pre-commit e ativar push protection e secret scanning no GitHub.
25. **Rate limiting.** Limitar login, cadastro, recuperação de senha, chat, convites e upload por IP e por conta (Durable Objects, KV ou regras do Cloudflare), com respostas 429 claras.
26. **Senhas.** Confirmar hash Argon2id/scrypt/PBKDF2 com parâmetros atuais, política mínima de senha e checagem de senhas vazadas via k-anonymity (HIBP).
27. **Sessões.** Cookies HttpOnly, Secure e SameSite, rotação do identificador no login, expiração, revogação ao trocar senha e lista de sessões ativas.
28. **Proteção CSRF.** Exigir token ou verificação de Origin em toda escrita autenticada por cookie, com testes.
29. **Cabeçalhos de segurança.** Configurar CSP restritiva, HSTS, X-Content-Type-Options, Referrer-Policy e Permissions-Policy, e testá-los no CI.
30. **Validação de entrada.** Validar todo endpoint com zod, limitar tamanhos, sanitizar texto do chat e de bio contra XSS e tratar links de forma segura (`rel=noopener`, sem `javascript:`).
31. **Uploads seguros.** Checar tipo por assinatura de bytes, limitar tamanho, reencodar imagens removendo EXIF, gerar nomes aleatórios e servir com `Content-Disposition` adequado.
32. **Fontes de vídeo seguras.** Para URL/HLS/Drive/incorporado: allowlist de domínios, bloqueio de IPs internos (SSRF), `sandbox` e `allow` restritos em iframes e validação no servidor, não só no cliente.
33. **Autorização por objeto.** Ampliar os testes de IDOR já existentes: salas, mídia privada, perfis, notificações, mensagens e rascunhos de catálogo devem negar acesso a outra conta.
34. **Papéis e administração.** Definir admin, moderador e usuário com menor privilégio, exigir reautenticação em ações destrutivas e garantir que a trilha de auditoria não possa ser editada.
35. **2FA e passkeys.** Oferecer TOTP e WebAuthn, obrigatórios para admin, com códigos de recuperação.
36. **E-mail transacional.** Configurar provedor (Resend, Cloudflare Email etc.) para verificação e recuperação de senha, com tokens de uso único e curta validade, sem revelar se o e-mail existe.
37. **Anti-bot.** Cloudflare Turnstile em cadastro, login, recuperação e envio de mensagens por contas novas.
38. **Moderação do chat.** Denúncia de mensagens, silenciar e banir com prazo, slow-mode, filtros de spam e painel de fila para moderadores com registro de decisões.
39. **Moderação de imagens.** Denúncia e remoção de fotos do chat, mais verificação automática de conteúdo impróprio antes de exibir publicamente.
40. **Dependências.** Ativar Dependabot ou Renovate, auditoria automática, lockfile versionado e SBOM.
41. **LGPD.** Política de privacidade e termos, consentimento registrado, exportação dos dados do usuário, exclusão de conta, prazos de retenção de logs e canal de contato do encarregado.
42. **Backup e recuperação.** Backups periódicos de D1 e R2, teste de restauração documentado e plano de resposta a incidentes.

### D. Conta e perfil

43. **Vincular provedores.** Permitir ligar e desligar e-mail/senha e ChatGPT na mesma conta, bloqueando duplicidade e exigindo ao menos um método de acesso.
44. **Mais logins sociais.** Google e Discord, este muito usado pela comunidade de anime, com o mesmo fluxo de vínculo.
45. **Regras do @.** Lista de nomes reservados e proibidos, limite de trocas, histórico e redirecionamento do @ antigo por um período.
46. **Alterar e-mail e senha.** Fluxo com reautenticação, confirmação no e-mail antigo e novo e notificação de segurança.
47. **Excluir conta.** Período de carência reversível, depois exclusão ou anonimização de mensagens, mídias e vínculos sociais.
48. **Central de privacidade.** Controle granular de quem vê atividade, listas, hall de destaques, status online e pedidos de amizade.
49. **Perfil enriquecido.** Links externos (AniList, MyAnimeList), bio com markdown seguro e etiquetas de gêneros favoritos sem aumentar a altura compacta do cabeçalho.
50. **Importar listas.** Importação de MyAnimeList (XML) e AniList (OAuth) com prévia, correspondência de títulos e resolução de ambiguidades.
51. **Estatísticas pessoais.** Tempo assistido, gêneros, sequência de dias e um resumo anual no estilo "Wrapped" compartilhável.
52. **Mais conquistas.** Ampliar de 20 para algo como 60, com raridade, progresso parcial visível e validação sempre no servidor para impedir forja.
53. **Economia de XP.** Balancear níveis, limites diários contra farm, e manter um registro (ledger) auditável de cada ganho de XP.
54. **Recompensas sazonais.** Além das 15 opções de capa/moldura/aura, criar itens por temporada ou evento, com data de expiração de desbloqueio e prévia.
55. **Avatar.** Upload com recorte, tamanhos otimizados, opção de avatares gerados e GIF limitado em tamanho e duração.
56. **Dispositivos e alertas.** Tela de dispositivos conectados com encerramento remoto e aviso de login em dispositivo novo.

### E. Catálogo, player e o que falta (comparação com sites de anime)

*Nota: o SuperAnimes é um site não oficial e não serve de referência para origem de conteúdo. A comparação abaixo usa só os recursos de produto comuns a sites e plataformas de anime (calendário, listas, comentários, chat, dublado/legendado, player).*

57. **Catálogo real.** Cadastrar episódios e fontes reais, somente de conteúdo licenciado ou autorizado, e popular metadados via AniList, Jikan ou TMDB.
58. **Página de título completa.** Sinopse, trailer, elenco, estúdio, status, nota, temporadas, relacionados e ordem cronológica.
59. **Player completo.** Legendas VTT/ASS, múltiplas faixas de áudio (dublado/legendado), qualidade adaptativa HLS, velocidade, Picture-in-Picture, atalhos de teclado e tela cheia consistente no mobile.
60. **Pular abertura e encerramento.** Marcações de tempo por episódio, botão "pular" e ajuste fino no painel admin.
61. **Continuar assistindo.** Lembrar posição por episódio, próximo episódio automático com contagem regressiva e fileira dedicada na home.
62. **Calendário de lançamentos.** Grade semanal por dia e horário no fuso do usuário, com lembrete de novo episódio, como fazem as grandes plataformas.
63. **Busca e filtros.** Gênero, ano, temporada, estúdio, status, dublado/legendado, ordenação, e busca tolerante a erros com autocomplete (FTS5 ou Meilisearch).
64. **Listas pessoais.** Assistindo, Completo, Planejo assistir, Pausado, Abandonado e Favoritos, com nota e data.
65. **Histórico sincronizado.** Histórico de reprodução entre dispositivos, com opção de limpar e de pausar o registro.
66. **Comentários por episódio.** Com marcação de spoiler, respostas, votos, denúncia e moderação.
67. **Notas e avaliações.** Avaliação por título com média, distribuição e proteção contra manipulação.
68. **Recomendações.** Similares por gênero e tags e "porque você assistiu X", começando com regras simples antes de qualquer modelo.
69. **Rankings.** Populares da semana, mais bem avaliados e estreias, com cache e atualização agendada.
70. **Categorias e editoriais.** Implementar a gestão global de categorias e a criação de editoriais (pendências declaradas): coleções curadas, destaque rotativo e agendamento.
71. **Reportar problema.** Botão "link quebrado" por episódio e fila no painel admin com status e resposta ao usuário.
72. **Verificação automática de fontes.** Cron que testa disponibilidade das fontes, alerta o admin e alterna para fonte alternativa.
73. **Upload grande.** Superar o limite de 100 MiB com upload multipart retomável para R2, transcodificação para HLS, miniaturas e sprites de preview.
74. **Títulos multilíngues.** Título original, romaji e português na busca, com slugs amigáveis e redirecionamentos.

### F. Comunidade e social

75. **Assistir juntos.** Sincronizar play, pause e seek nas salas com correção de desvio, controle de host, reconexão e testes de latência (Durable Objects ou WebSocket).
76. **Chat da sala.** Emotes, reações, menções, respostas e indicador de digitação, com limites de taxa.
77. **Reações ao vivo.** Reações flutuantes opcionais sobre o vídeo, desligáveis por quem prefere tela limpa.
78. **Notificações push.** Web Push via Service Worker, resumo por e-mail, preferências por tipo e agrupamento de notificações repetidas.
79. **Amizades.** Sugestões, ver o que amigos estão assistindo (respeitando privacidade) e convite por link ou QR code.
80. **Auditoria de bloqueios.** Testar o efeito do bloqueio em chat, salas, perfil, notificações, convites e menções.
81. **Chat global em canais.** Canais por tema, regras fixadas, histórico paginado, lista virtualizada e modo lento.
82. **Eventos.** Sessões agendadas com RSVP, lembretes e calendário, ligadas às salas.
83. **Grupos.** Grupos ou clãs com perfil, ranking semanal e cargos, reaproveitando conquistas.
84. **Convites de sala.** Revisar expiração, limite de uso e revogação dos links, já que o compartilhamento repetido de convites existe.

### G. Interface visual

85. **Design system.** Tokens de cor, espaçamento, raio e tipografia, mais Storybook com os componentes documentados e estados.
86. **Temas.** Claro, escuro, AMOLED e alto contraste, respeitando `prefers-color-scheme` e persistindo escolha por conta.
87. **Acessibilidade WCAG 2.2 AA.** Contraste, foco visível, navegação por teclado, rótulos ARIA, texto alternativo e teste automático com axe no CI.
88. **Home com hierarquia clara.** Destaque, continuar assistindo, novos episódios, tendências e recomendados, com skeletons no lugar de spinners.
89. **Cartões de título.** Prévia ao passar o mouse, selo de episódio novo, etiqueta dublado/legendado e nota, sem poluir o cartão.
90. **Responsividade total.** Estender os testes de 320 a 3440 px que já cobrem o perfil para todas as páginas, incluindo safe-area e barra móvel.
91. **Estados vazios, erro e offline.** Telas com orientação e ação, páginas 404/500 próprias e aviso quando a conexão cair.
92. **Onboarding.** Escolha de gêneros favoritos, tour curto e primeira conquista automática, pulável a qualquer momento.
93. **PWA.** Manifest, ícones, tela de abertura, instalação, cache do shell e das capas mais usadas.
94. **Internacionalização.** PT-BR como base, mais EN e ES, com textos fora do código e formatação de datas e números por localidade.
95. **Tipografia e ícones.** Fontes com subset e `font-display`, e um único conjunto de ícones consistente.

### H. Animações e transições

96. **View Transitions.** Usar a View Transitions API na navegação, incluindo cartão para página de detalhe com elemento compartilhado, com fallback sem animação.
97. **Orçamento de animação.** Animar só `transform` e `opacity`, medir INP e CLS e proibir animações que causem reflow.
98. **Movimento reduzido.** Garantir `prefers-reduced-motion` em todas as animações, não só nas já tratadas, e adicionar chave nas configurações.
99. **Pausa fora da tela.** Centralizar em um hook a pausa de partículas, canvas e retratos animados quando saem da tela ou da aba, hoje aplicada em pontos isolados.
100. **Micro-interações.** Favoritar, avaliar, progresso e toasts com duração e easing definidos em tokens para toda a interface se mover do mesmo jeito.
101. **Troca de banners e temas.** Estender o relógio único de banners a outras trocas, com crossfade suave e sem salto de layout.
102. **Controles do player.** Esconder controles com atraso, miniaturas ao arrastar a barra, estado de carregamento e transição ao trocar de episódio.
103. **Modo economia de efeitos.** Detectar aparelhos fracos (`deviceMemory`, `hardwareConcurrency`, bateria) e reduzir partículas e auras automaticamente, com opção manual.

### I. Performance, SEO e infraestrutura

104. **Core Web Vitals.** Imagens em AVIF/WebP responsivas, preload da imagem principal, dimensões fixas e meta de LCP abaixo de 2,5 s medida em CI.
105. **Cache.** Estratégia de CDN com `stale-while-revalidate` para catálogo e capas, ETags e invalidação ao publicar.
106. **SEO.** Renderização no servidor das páginas de título, metadados, Open Graph dinâmico, sitemap e dados estruturados (TVSeries, VideoObject).
107. **Analytics com privacidade.** Plausible ou Umami para funil de reprodução, erros de player e abandono, sem rastrear dados pessoais.
108. **Monitoramento.** Health checks, página de status, alertas de indisponibilidade e orçamento de erros.
109. **Controle de custos.** Alertas de leituras em D1 e de saída de R2, com limites e cache para evitar surpresa na fatura.
110. **Feature flags e testes de carga.** Liberar perfis, salas e chat gradualmente com flags, e testar carga de chat e salas com k6 antes de abrir ao público.

### J. Legal e conteúdo (aplicar junto com a Onda 0)

- Criar formulário de remoção de conteúdo (DMCA/notificação de direitos autorais), termos de uso e política de conteúdo.
- Revisar o modelo de múltiplas fontes (URL, Drive, incorporado): garantir que o catálogo só aponte para conteúdo com licença ou autorização, e registrar a origem de cada fonte no painel admin.

## 5. Formato da resposta final

Responda em português do Brasil. Comece com um resumo de 10 linhas (estado atual, riscos críticos, ordem das ondas). Depois entregue a tabela das 110 sugestões, o roadmap e a lista de PRs abertos com links. Se algo não puder ser verificado, diga explicitamente em vez de supor.
