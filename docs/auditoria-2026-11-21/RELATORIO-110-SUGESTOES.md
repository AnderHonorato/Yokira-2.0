# Yokira 2.0 — Auditoria de engenharia e roadmap (21/11/2026)

> **Escopo**: branch `sol/identidade-login-temas-20261105`, commit `25afce8`, PR [#21](https://github.com/AnderHonorato/Yokira-2.0/pull/21).
> Este relatório diferencia evidência positiva de verificação incompleta. **PARCIAL** significa que existe código relacionado, não que o requisito esteja terminado. **NÃO VERIFICADO** substitui um status inventado.
> Não houve operação em produção nem inspeção de registros de contas. Nenhum segredos é reproduzido.

## Resumo em dez linhas
1. O repositório possui duas aplicações: SvelteKit na raiz e React/Vinext em `versao-sites/`.
2. `main` não é a branch de desenvolvimento da versão Sites; alterações devem ir por PRs.
3. PR #21 reúne mudanças extensas; recomenda-se divisão funcional e validação independente.
4. O CI de Sites tem typecheck, testes, lint, build e auditoria de dependências.
5. Playwright de Sites testa Chromium em 390px/1440px; cobertura de outros motores é pendente.
6. Migrações D1 `0000` até `0019` e testes em SQLite local já existem.
7. Validação de URLs HTTPS, credenciais e IPs locais está demonstrada por testes.
8. A ocorrência histórica do GitGuardian precisa de conferência manual e eventual rotação.
9. Paridade entre Sites, Vercel e outras hospedagens não foi atestada.
10. Ordem recomendada: Onda 0 credenciais → Onda 1 CI/migrações → Onda 2 funções → Onda 3 acabamento.

## Dez frentes de revisão

| Frente | Evidências (somente o que foi inspecionado) | Risco / urgência |
| --- | --- | --- |
| Estrutura | `README.md`, `versao-sites/README.md`, refs Git `main`, `main-ChatGPT`, `sol/identidade-login-temas-20261105` | **alto**: branches e dois runtimes dificultam release |
| Código | `.github/workflows/verificacoes-sites.yml`, `versao-sites/lib/servidor/*.test.mjs` | **médio**: ampliar cobertura de testes e rastrear CI real |
| Interface | `playwright.sites.config.ts` e workflow Chromium | **médio**: faltam evidências de navegação por teclado e WebKit/Firefox |
| Animações/transições | implementação visual não validada em navegador nesta matriz | **não verificado**: medir movimento reduzido, INP e CLS |
| Segurança | `validacao-fontes-episodio.ts`, `autenticacao-http.ts`, `validacao.test.mjs` | **alto**: alerta histórico de credencial exige triagem |
| Conta | `autenticacao.ts`, `autenticacao-entrada.ts`, `autenticacao-http.ts` | **alto**: verificar troca de senha, e-mails e sessão por dispositivo |
| Catálogo/player | `catalogo-administrativo.ts`, `temporadas.ts`, `fontes-episodio.test.mjs` | **alto**: não confundir metadados com licença de reprodução |
| Comunidade | `social-amizades.ts`, `salas.ts`, `chat-global-moderacao.ts` | **médio**: rever permissões de sala e abuso por conta |
| Performance/SEO/infra | CI Sites, `worker/index.ts`, `next.config.ts` | **médio**: observabilidade e paridade dos deployments sem prova |
| Legal | `docs/VALIDACAO.md` e material do catálogo exigem checagem adicional | **alto**: autorização de mídia e privacidade precisam de revisão |

## Matriz das 110 sugestões

**Contagem parcial:** FALTA: 1; NÃO VERIFICADO: 60; PARCIAL: 49. Esforço (P/M/G) e impacto são **estimativas iniciais**, não tempos prometidos.

| Nº | Proposta | Status | Esforço | Impacto | Evidência | Limite da verificação |
|---:|---|---|:---:|---|---|---|
| 1 | Consolidar branches. | FALTA | G | alto | `README.md` | main permanece distinta da branch com a aplicacao; referencias remotas confirmadas |
| 2 | Organizar a pasta `versao-sites/`. | NÃO VERIFICADO | G | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 3 | Remover código morto. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 4 | Camadas no servidor. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 5 | Migrações D1 confiáveis. | PARCIAL | G | alto | `versao-sites/lib/servidor/fontes-episodio.test.mjs` | testes aplicam migrações do zero; faltava verificador CI dedicado/rollback |
| 6 | Variáveis de ambiente validadas. | NÃO VERIFICADO | G | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 7 | Contratos de API tipados. | NÃO VERIFICADO | G | alto | — | inspecao especifica de codigo e fluxo necessaria |
| 8 | README e documentação reais. | PARCIAL | M | médio | `versao-sites/README.md` | documentacao de setup e deploy existe, mas ainda mistura orientacoes de starter |
| 9 | Decidir o alvo de deploy. | PARCIAL | M | médio | `versao-sites/README.md` | Sites e preview sao superficies distintas; paridade nao comprovada |
| 10 | Convenções de repositório. | NÃO VERIFICADO | P | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 11 | Testes de componentes. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 12 | E2E no CI. | PARCIAL | G | alto | `.github/workflows/verificacoes-sites.yml` | E2E Chromium no CI; Firefox e WebKit nao configurados |
| 13 | TypeScript rigoroso. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 14 | ESLint mais exigente. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 15 | Helper de chunking para D1. | PARCIAL | M | médio | `versao-sites/lib/servidor/conquistas-d1.test.mjs` | regressoes do limite D1 cobertas, helper global nao confirmado |
| 16 | Erros padronizados. | PARCIAL | M | médio | `versao-sites/lib/servidor/validacao.ts` | ErroApi e validacao existem; contrato global nao confirmado |
| 17 | Logs estruturados. | NÃO VERIFICADO | G | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 18 | Quebrar componentes grandes. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 19 | Reduzir o bundle. | NÃO VERIFICADO | G | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 20 | Camada de dados no cliente. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 21 | Idempotência. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 22 | CI completo. | PARCIAL | M | alto | `.github/workflows/verificacoes-sites.yml` | typecheck/test/lint/build/audit e Chromium no workflow; nao prova CI verde |
| 23 | URGENTE: segredo detectado. | NÃO VERIFICADO | M | alto | `versao-sites/lib/servidor/validacao-fontes-episodio.ts` | url.password e propriedade de URL, nao segredo literal; alerta historico GitGuardian precisa ser conferido |
| 24 | Prevenção de vazamento. | PARCIAL | P | alto | `.github/workflows/proteger-segredos.yml` | Gitleaks configurado nesta branch; protecao GitHub e execucao do job pendentes |
| 25 | Rate limiting. | PARCIAL | G | alto | `versao-sites/lib/servidor/autenticacao-entrada.ts` | limitador existe para autenticacao; escopo de outros endpoints nao confirmado |
| 26 | Senhas. | PARCIAL | M | alto | `versao-sites/lib/servidor/autenticacao.ts` | sistema de autenticacao existe; parametros e verificacao HIBP nao confirmados |
| 27 | Sessões. | PARCIAL | M | alto | `versao-sites/lib/servidor/autenticacao-http.ts` | sessao via cookie HttpOnly declarada no handler; inventario e revogacao nao confirmados |
| 28 | Proteção CSRF. | PARCIAL | M | alto | `versao-sites/lib/servidor/validacao.test.mjs` | bloqueio de origem em escrita JSON testado, sem garantia de todos endpoints |
| 29 | Cabeçalhos de segurança. | PARCIAL | G | alto | `versao-sites/lib/servidor/imagens-comunidade.ts` | CSP e nosniff em midia; politica global nao confirmada |
| 30 | Validação de entrada. | PARCIAL | M | alto | `versao-sites/lib/servidor/validacao.ts` | validacao de payload e tamanho testada; cobertura completa nao confirmada |
| 31 | Uploads seguros. | PARCIAL | M | alto | `versao-sites/lib/servidor/validacao-midia.ts` | regras de validacao de midia presentes; EXIF e reencodificacao nao verificados |
| 32 | Fontes de vídeo seguras. | PARCIAL | M | alto | `versao-sites/lib/servidor/validacao-fontes-episodio.ts` | URL HTTPS, credenciais e IP privado rejeitados; allowlist universal nao demonstrada |
| 33 | Autorização por objeto. | PARCIAL | M | alto | `versao-sites/lib/servidor/fontes-episodio.test.mjs` | testes de acesso de administrador e isolamento de episodio; ampliar cobertura |
| 34 | Papéis e administração. | PARCIAL | M | alto | `versao-sites/lib/servidor/permissoes.ts` | papeis e verificacoes administrativas existentes; protecao completa nao verificada |
| 35 | 2FA e passkeys. | NÃO VERIFICADO | G | alto | — | inspecao especifica de codigo e fluxo necessaria |
| 36 | E-mail transacional. | NÃO VERIFICADO | G | alto | — | inspecao especifica de codigo e fluxo necessaria |
| 37 | Anti-bot. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 38 | Moderação do chat. | PARCIAL | M | médio | `versao-sites/lib/servidor/chat-global-moderacao.ts` | moderacao do chat implementada parcialmente |
| 39 | Moderação de imagens. | PARCIAL | M | médio | `versao-sites/lib/servidor/imagens-comunidade.ts` | controle de imagens existente; moderacao automatica nao verificada |
| 40 | Dependências. | PARCIAL | M | alto | `.github/workflows/verificacoes-sites.yml` | audit de dependencias no CI, demais mecanismos nao confirmados |
| 41 | LGPD. | NÃO VERIFICADO | M | alto | — | inspecao especifica de codigo e fluxo necessaria |
| 42 | Backup e recuperação. | NÃO VERIFICADO | G | alto | — | inspecao especifica de codigo e fluxo necessaria |
| 43 | Vincular provedores. | PARCIAL | M | médio | `versao-sites/lib/servidor/autenticacao.ts` | login existente, vinculo seguro de provedores nao confirmado |
| 44 | Mais logins sociais. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 45 | Regras do @. | PARCIAL | M | médio | `versao-sites/lib/servidor/autenticacao-esquema.ts` | identidade de conta mapeada; historico e redirecionamento de @ nao confirmados |
| 46 | Alterar e-mail e senha. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 47 | Excluir conta. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 48 | Central de privacidade. | PARCIAL | M | médio | `versao-sites/lib/servidor/social-perfis.ts` | regras de perfil e privacidade existem |
| 49 | Perfil enriquecido. | PARCIAL | M | médio | `versao-sites/lib/servidor/perfis-ricos.ts` | camada de perfis enriquecidos presente |
| 50 | Importar listas. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 51 | Estatísticas pessoais. | PARCIAL | M | médio | `versao-sites/lib/servidor/atividade-video.ts` | registro de atividade presente; wrapped/estatisticas nao confirmados |
| 52 | Mais conquistas. | PARCIAL | M | médio | `versao-sites/lib/servidor/conquistas.ts` | conquistas existem, ampliacao para 60 nao confirmada |
| 53 | Economia de XP. | PARCIAL | M | médio | `versao-sites/lib/servidor/conquistas-fatos.ts` | fatos de XP implementados; ledger e limites nao comprovados |
| 54 | Recompensas sazonais. | PARCIAL | M | médio | `versao-sites/lib/servidor/personalizacao-perfil.ts` | cosmeticos de perfil presentes; eventos sazonais nao comprovados |
| 55 | Avatar. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 56 | Dispositivos e alertas. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 57 | Catálogo real. | PARCIAL | G | alto | `versao-sites/lib/servidor/catalogo-administrativo.ts` | cadastro administrativo existe; catalogo de conteudo licenciado nao verificado |
| 58 | Página de título completa. | PARCIAL | M | médio | `versao-sites/lib/servidor/temporadas.ts` | temporadas e episodios presentes; pagina completa nao comprovada |
| 59 | Player completo. | PARCIAL | G | alto | `versao-sites/lib/servidor/midia.ts` | midia existente; todas as opcoes de player nao verificadas |
| 60 | Pular abertura e encerramento. | NÃO VERIFICADO | P | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 61 | Continuar assistindo. | PARCIAL | M | médio | `versao-sites/lib/servidor/progresso-episodios.ts` | progresso por episodio presente; proximo automatico nao confirmado |
| 62 | Calendário de lançamentos. | NÃO VERIFICADO | G | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 63 | Busca e filtros. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 64 | Listas pessoais. | PARCIAL | M | médio | `versao-sites/lib/servidor/progresso-episodios.ts` | progresso e colecoes relacionados; todas as listas nao conferidas |
| 65 | Histórico sincronizado. | PARCIAL | M | médio | `versao-sites/lib/servidor/progresso-episodios.ts` | persistencia de progresso implementada; controle de historico nao verificado |
| 66 | Comentários por episódio. | NÃO VERIFICADO | G | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 67 | Notas e avaliações. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 68 | Recomendações. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 69 | Rankings. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 70 | Categorias e editoriais. | PARCIAL | M | médio | `versao-sites/lib/servidor/catalogo-administrativo.ts` | catalogo administravel; editoriais globais nao confirmados |
| 71 | Reportar problema. | NÃO VERIFICADO | P | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 72 | Verificação automática de fontes. | PARCIAL | M | médio | `versao-sites/lib/servidor/validacao-fontes-episodio.ts` | fontes validadas na escrita, sem comprovacao de cron de saude |
| 73 | Upload grande. | NÃO VERIFICADO | G | alto | — | inspecao especifica de codigo e fluxo necessaria |
| 74 | Títulos multilíngues. | NÃO VERIFICADO | P | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 75 | Assistir juntos. | PARCIAL | G | alto | `versao-sites/lib/servidor/salas.ts` | salas existem; sincronizacao de player e controle de latencia nao verificados |
| 76 | Chat da sala. | PARCIAL | M | médio | `versao-sites/lib/servidor/salas-mutacoes.ts` | estado e mensagens de sala, recursos detalhados nao confirmados |
| 77 | Reações ao vivo. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 78 | Notificações push. | PARCIAL | G | médio | `versao-sites/lib/servidor/notificacoes-sociais.ts` | notificacoes sociais, sem confirmacao de Web Push |
| 79 | Amizades. | PARCIAL | M | médio | `versao-sites/lib/servidor/social-amizades.ts` | sistema de amizades presente |
| 80 | Auditoria de bloqueios. | PARCIAL | M | médio | `versao-sites/lib/servidor/social.test.mjs` | testes sociais existentes; matriz total de bloqueios nao confirmada |
| 81 | Chat global em canais. | PARCIAL | M | médio | `versao-sites/lib/servidor/chat-global.ts` | chat global presente; canais, slow-mode e virtualizacao nao comprovados |
| 82 | Eventos. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 83 | Grupos. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 84 | Convites de sala. | PARCIAL | M | médio | `versao-sites/lib/servidor/salas-mutacoes.ts` | fluxos de convite em salas; expiracao/revogacao nao completamente verificadas |
| 85 | Design system. | NÃO VERIFICADO | G | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 86 | Temas. | PARCIAL | M | médio | `versao-sites/lib/servidor/aparencia.ts` | gestao de aparencia presente; quatro temas nao comprovados |
| 87 | Acessibilidade WCAG 2.2 AA. | NÃO VERIFICADO | G | alto | — | inspecao especifica de codigo e fluxo necessaria |
| 88 | Home com hierarquia clara. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 89 | Cartões de título. | NÃO VERIFICADO | P | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 90 | Responsividade total. | PARCIAL | M | médio | `playwright.sites.config.ts` | CI valida 390px e 1440px; falta varredura 320-3440px |
| 91 | Estados vazios, erro e offline. | NÃO VERIFICADO | G | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 92 | Onboarding. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 93 | PWA. | PARCIAL | G | médio | `src/service-worker.ts` | PWA existe na base Svelte; equivalencia na versao Sites nao comprovada |
| 94 | Internacionalização. | NÃO VERIFICADO | P | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 95 | Tipografia e ícones. | NÃO VERIFICADO | P | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 96 | View Transitions. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 97 | Orçamento de animação. | NÃO VERIFICADO | G | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 98 | Movimento reduzido. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 99 | Pausa fora da tela. | NÃO VERIFICADO | P | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 100 | Micro-interações. | NÃO VERIFICADO | P | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 101 | Troca de banners e temas. | PARCIAL | P | médio | `versao-sites/lib/servidor/banners.ts` | gestao de banners presente; sincronismo das demais transicoes nao comprovado |
| 102 | Controles do player. | PARCIAL | M | médio | `versao-sites/lib/servidor/midia.ts` | reproducao servida; microinteracoes player nao verificadas |
| 103 | Modo economia de efeitos. | NÃO VERIFICADO | G | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 104 | Core Web Vitals. | NÃO VERIFICADO | G | alto | — | inspecao especifica de codigo e fluxo necessaria |
| 105 | Cache. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 106 | SEO. | NÃO VERIFICADO | G | alto | — | inspecao especifica de codigo e fluxo necessaria |
| 107 | Analytics com privacidade. | NÃO VERIFICADO | M | médio | — | inspecao especifica de codigo e fluxo necessaria |
| 108 | Monitoramento. | NÃO VERIFICADO | G | alto | — | inspecao especifica de codigo e fluxo necessaria |
| 109 | Controle de custos. | NÃO VERIFICADO | M | alto | — | inspecao especifica de codigo e fluxo necessaria |
| 110 | Feature flags e testes de carga. | NÃO VERIFICADO | G | alto | — | inspecao especifica de codigo e fluxo necessaria |

## Roadmap

**Onda 0 — segurança imediata.** Triagem GitGuardian; Gitleaks no CI e pre-commit; revisar segredos, sessões, CSRF, CSP, upload e permissão por objeto; documentar resposta a incidente. Primeira PR: workflow de detecção de segredos.

**Onda 1 — fundação.** Verificador de migrações D1 de zero, teste de regressão, endurecimento de CI, inventário das branches e README específico, ferramentas de qualidade e contratos validados. PR separada: migrações + testes.

**Onda 2 — produto.** E-mail transacional, editoriais, player adaptativo, continuidade, listas, notificações, moderação, salas sincronizadas, catálogo apenas de conteúdo autorizado.

**Onda 3 — polimento.** WCAG 2.2 AA, redução de movimento, performance real (LCP/INP/CLS), imagens otimizadas, SEO e animações responsivas.

## Critérios de aceite e bloqueios

- Não fazer merge sem revisar diffs e relatórios de CI por PR.
- Não adicionar conteúdo audiovisual sem autorização documentada.
- Não reescrever histórico para tratar alerta de segredo até verificar incidência, revogar credenciais reais e combinar com colaboradores.
- Screenshots não comprovam autenticação, observabilidade, conformidade LGPD ou ausência de vulnerabilidades.
- As linhas marcadas **NÃO VERIFICADO** permanecem hipóteses; não foram inferidas pela ausência de um nome de arquivo.
