# Continuidade do Yokira para outra IA

Este documento resume o pedido do usuário e o estado técnico. Não é uma
transcrição do chat nem um link compartilhado do ChatGPT. Não contém credenciais.

## Projeto e acesso

- GitHub: https://github.com/AnderHonorato/Yokira-2.0
- Branch de trabalho: `sol/identidade-login-temas-20261105`.
- PR: https://github.com/AnderHonorato/Yokira-2.0/pull/21 — base `main-ChatGPT`.
- Aplicação GPT: https://yokira-2-ander.honoratoann.chatgpt.site
- Administração: `/?p=admin`; cadastro de conteúdo: `/?p=acervo-admin`.
- O código publicado está em `versao-sites`, React/Vinext + Cloudflare D1/R2.
  A raiz SvelteKit/Prisma é outra aplicação. Alterar só a raiz não muda o Sites.
- Hospedagem Sites tem repositório de origem próprio, separado do GitHub. Um
  merge no GitHub não publica automaticamente o link acima.

## Pedidos e correções explícitas do usuário

1. Marca pública apenas Yokira, sem 2.0; usar o emblema antigo de cobra/katana/YKA
   em animação contínua. Preservar esse desenho.
2. Dez cenários ricos e animados na página inicial. O usuário rejeitou as primeiras
   artes SVG por serem simples e genéricas.
3. **Somente administradores podem escolher o fundo. A escolha vale para todos.**
   Não devolver seletor de cenário a visitantes nem rotação pessoal/por relógio.
4. Administração fácil de séries, filmes, gêneros/categorias, temporadas,
   episódios, publicação, arquivamento, usuários, papéis e moderação.
5. Conteúdo pode ser hospedado na Yokira, no Google Drive, em outro armazenamento
   ou em player de terceiros. Todas as fontes ativas devem aparecer para escolher
   na página do vídeo; não reduzir a experiência ao player demonstrativo.
6. Conquistas e níveis devem ter celebrações marcantes. Cada evento celebra uma
   única vez, mesmo entre abas/dispositivos. O histórico privado permanece no sino
   com link para a atividade de origem. Preservar essas garantias de segurança.
7. Efeitos visuais em cards, botões, navegação e demais áreas, mantendo composição,
   responsividade e legibilidade. Preferência por movimento reduzido continua válida.
8. Publicar no mesmo link do GPT e enviá-lo cedo. O usuário ficou frustrado por
   pedir o link atualizado várias vezes; não responder só com planos.
9. O usuário pediu acesso ao contexto por outra IA. Não inventar URL do chat.
   Um link real de conversa compartilhada é criado no botão Compartilhar do ChatGPT.
   Este arquivo fornece continuidade técnica acessível pelo GitHub.

## Estado da implementação

A publicação anterior, versão Sites 4, já contém administração, cadastro de
conteúdo, múltiplas fontes, R2, marca antiga e notificações persistentes. Passou
por 58 testes, typecheck e build. HTTP real confirmou página/catálogo, bloqueio de
área privada e rota R2. O proprietário é configurado por allowlist privada no Worker.

A revisão visual seguinte implementa:

- Migração incremental `0010_aparencia_global`, cenário e intensidade globais com
  autorização administrativa, revisão monotônica SQL e auditoria atômica.
- Aba Aparência no admin; GET público `acao=aparencia` e POST administrativo
  `acao=salvar-aparencia`. Visitantes sincronizam a escolha em até 15 segundos e
  quando retornam à aba. Nenhum controle de escolha aparece no hero.
- Dez ilustrações novas, geradas individualmente e inspecionadas, em WebP
  1600×900, mais miniaturas administrativas. SVGs antigos ficam só como fallback.
- Atmosfera Canvas por cena: pétalas, chuva, neve, bolhas e partículas luminosas,
  com suspensão quando a página/cena não está visível e redução de movimento.
- Celebração com emblema em cristal 3D, aurora, ondas, cortes, órbitas e evolução
  de nível; claims do servidor não foram alterados.
- Camada `app/efeitos-visuais.css` para o restante da interface.

O estado final de publicação e validação deve ser conferido no histórico do PR e
na versão Sites atual. Antes de editar, conferir `git status`, HEAD e mudanças
feitas por outras sessões; preservar trabalho concorrente.

## Arquivos principais

- `versao-sites/.openai/hosting.json`: identidade Sites, `DB` e `BUCKET`.
- `app/api/yokira/route.ts`: API e autorização por ação.
- `lib/servidor/aparencia.ts`, `app/componentes/aparencia-admin.tsx`: fundo global.
- `app/componentes/cenarios-hero.tsx`, `atmosfera-cenario.tsx` e
  `public/arte/cenarios/`: arte e atmosfera.
- `app/componentes/notificacoes.tsx`, `celebracao.tsx` e CSS: histórico/celebrações.
- `lib/servidor/notificacoes.ts`: eventos e reivindicação única persistida.
- `lib/servidor/catalogo-administrativo.ts`, `temporadas.ts`, `fontes-episodio.ts`:
  catálogo, episódios e fontes.
- `app/componentes/reproducao.tsx`: seletor de player e retomada individual.
- `lib/servidor/midia.ts`, rotas `app/api/midia`: upload e streaming R2.
- `docs/ATUALIZACAO-20261105.md`: operação e limites reais.

## Regras importantes

- Identidade vem do dispatch Sites, nunca de um usuário/papel fornecido no JSON.
- `YOKIRA_ADMIN_EMAILS` é configuração privada do Worker. Não colocar seu valor em
  fonte, frontend, documentos públicos ou logs.
- Toda escrita administrativa reconfere a permissão no banco. O último admin
  ativo é protegido por triggers. Configuração e auditoria usam transação.
- `loteAtomico(db, SQL[])` usa D1 nativo. Não trocar por `db.batch(db.run(...))`:
  essa combinação apresentou falha com o adaptador Drizzle usado aqui.
- Migrações aplicadas são imutáveis. Manter schema, snapshots e journal coerentes.
- Upload próprio é de até 100 MiB; maiores podem usar URL externa. Rascunhos não
  são liberados só por conhecer o ID. Range/HEAD preservam autorização.
- Iframes só recebem URL HTTPS validada, sem HTML arbitrário, com sandbox.
- Textos em português e CSS separado; preservar tokens e identidade existente.
- Neste ambiente `SITES_MANAGED_LINUX_CONTAINER=1` sem ferramenta `cua_repl.js`.
  Não improvisar outro navegador local: usar o fluxo Sites permitido quando
  disponível e relatar a limitação de QA visual.

## Validar e publicar

Em `versao-sites`:

```sh
pnpm run typecheck
pnpm test
pnpm run lint
pnpm run build
pnpm run build:preview
```

Testes de navegador do projeto: `npx playwright test --config=playwright.sites.config.ts`.
O CI prepara o D1 local com todas as migrações antes deles. Não alegar execução de
testes que não foram realizados.

Publicar pelo projeto Sites já existente: obter credencial temporária, sincronizar
a fonte, construir a mesma revisão, enviar commit, salvar versão com arquivo de
build e implantar. Nunca expor token nem criar outro site para contornar problemas.
O pacote deve conter `.openai/hosting.json`, `.openai/drizzle` e o entrypoint em
`dist/server/index.js`, mantendo `dist/client` e demais recursos correspondentes.
Confirmar resultado nativo da publicação e fazer verificações HTTP sem simular
identidade de usuário. Login interativo e players externos exigem a conta/arquivos
reais e não foram automaticamente validados por completo.
