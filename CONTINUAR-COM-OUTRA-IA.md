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

A revisão visual está publicada na versão Sites 5 e implementa:

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

A versão Sites 5 foi confirmada como publicada, com origem
`a2983365f6c1261ac57c86040d5c1e0729333587`. O código correspondente foi enviado ao
GitHub no commit `c056cf4`. Foram aprovados 65 testes locais, TypeScript, lint sem
erros, builds de produção/prévia e os três jobs do CI Sites, incluindo Chromium
em 390px e 1440px: https://github.com/AnderHonorato/Yokira-2.0/actions/runs/42018030481.
HTTP real confirmou a home sem seletor, a imagem WebP nova, aparência global e
recusa de dados pessoais sem login. Admin → Aparência inclui prévias de conquista
e nível sem gravar XP ou notificações. Uma falha de formatação no teste mobile do
workflow geral foi identificada e corrigida com Prettier, sem alterar comportamento.

O estado de publicação e validação deve ser conferido no histórico do PR e
na versão Sites atual. Antes de editar, conferir `git status`, HEAD e mudanças
feitas por outras sessões; preservar trabalho concorrente.

## Evolução social publicada na versão 7

- Origem Sites `dadecff3fde9d0badf1627b874278b506c7f6357`; implementação GitHub
  `211da482b31e969cc1ff9e7cfc92eae71b51b29b` (inclui a revisão social
  `9aca03258eb951553d6fc62d55abd6a718114d8c`). Publicação confirmada pelo Sites,
  configuração de ambiente revisão 2. Mesmo endereço público.
- 20 conquistas calculadas por feitos persistidos, emblemas distintos animados,
  raridades por cor e forma e hall com três destaques editáveis e persistentes.
- Níveis evoluem em oito faixas, com refinamento por nível e partículas limitadas.
  Cobra SVG percorre as letras YKA em camadas de frente e fundo, em loop.
- Cabeçalho completo fica na parte inferior no celular, acima da navegação. Uma
  única instância de notificações preserva a reivindicação de celebração.
- Cadastro/login e-mail/senha com better-auth, sessão D1, cookies seguros, senha
  forte e sugestões. Login ChatGPT preservado. Contas têm namespace `conta:` e
  não são fundidas automaticamente. Nunca promover admin por e-mail não verificado.
- **Sem serviço de envio de e-mails:** verificação e recuperação de senha ainda
  indisponíveis. `BETTER_AUTH_SECRET` e `BETTER_AUTH_URL` estão configurados no Sites;
  não expor seus valores. A administração automática segue apenas identidade
  ChatGPT confiável e allowlist privada.
- `@` único para ambos os provedores, sugestões verificadas, privacidade do perfil,
  busca, solicitações de amizade e bloqueios. Perfil começa privado; usuário pode
  habilitar busca pública no editor do perfil.
- Salas privadas por episódio publicado, dupla/grupo até 2/12, convite imprevisível,
  chat persistente, gestão pelo dono e sincronização do player nativo a cada dois
  segundos. Iframes externos têm aviso de ausência de sincronização universal.
- Admin configura banners, artes com personagens em camada separada, ordem,
  ativação e intervalo padrão/individual entre 3–60 segundos. Imagens R2 seguem
  visibilidade do banner/título. Moderação das mensagens das salas com auditoria.
- Frases promocionais removidas da home, cabeçalho e rodapé. Fundo de dez cenários
  permanece APENAS administrativo; o carrossel de anúncios é separado.
- Migrações 0011–0015, schemas em módulos, snapshots e journal coerentes.
- Validações locais: 99 testes, typecheck, lint sem erros, builds de produção e
  prévia, audit sem alto/crítico; `db:generate` sem alterações pendentes.
- CI aprovado: https://github.com/AnderHonorato/Yokira-2.0/actions/runs/42129141413.
  Backend, prévia e 20 testes Chromium aprovados, incluindo 320–1440px com e sem
  sessão. Corrigido overflow causado pelo cartão pessoal criar coluna implícita
  na grade móvel e evitado clique em Mais antes da hidratação. HTTP real confirmou
  páginas, três banners, imagens e recusa de APIs privadas sem sessão.
  Mais detalhes em `versao-sites/docs/EVOLUCAO-SOCIAL.md`.

## Correção visual publicada na versão 8

O usuário rejeitou a criação de uma segunda barra inferior e o redesenho SVG do
ícone. **Manter uma única barra e animar a arte original, sem substituí-la.**

- Marca usa o mesmo `/marca/emblema-192.png`, sem alteração de bytes. A região
  da cobra recebe movimento em loop; letras e identidade original são preservadas.
- Controles foram incorporados à navegação inferior existente, em uma única linha.
  Agenda, comunidade e preferências continuam acessíveis pelo menu Mais.
- Banner de destaques móvel reduzido de 610 para cerca de 244 px; abertura da home
  reduzida para 220 px e ranking compacto, sem perder os quatro títulos.
- Origem Sites `46de9ac3ff2f8fda9d9265dfc6d9bef5d37920bb`, versão 8 confirmada
  como publicada no mesmo link. Código GitHub `03ba469290baa6a85bd06730145594fcf10a3254`.
- CI aprovado: https://github.com/AnderHonorato/Yokira-2.0/actions/runs/42132879743.
  Backend e builds aprovados; 22 casos de navegador concluídos, com uma repetição
  automática no primeiro carregamento da prévia. Layout 320–1440 px, SHA256 do
  emblema original e movimento reduzido verificados. Captura de 390 px inspecionada.

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

- Identidade vem do dispatch Sites ou de sessão better-auth validada no servidor,
  nunca de um usuário/papel fornecido no JSON.
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
