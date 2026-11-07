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
10. **Correção mais recente:** o perfil estava grande e cheio de cards. Manter
    capa baixa, identidade/XP integrados, destaques em faixa e coleção em linhas.
    Não reintroduzir pedestais, blocos gigantes ou painéis dentro de painéis.

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

## Chat global, ultrawide e marca na abertura — versão 10

- Publicação Sites 10 confirmada no mesmo endereço, origem
  `cb1927b77ad53c1d003e8d0ea5f37715201ec2e5`, ambiente revisão 2. A versão 9
  foi salva para revisão; a publicação passou diretamente da 8 para a 10.
- GitHub: implementação `2c6bf16`, refinamentos `bbeb842`, marca `9e5bff9`
  e documentação `bb6c5ed`, na mesma branch e PR 21.
- Correção explícita mais recente: **o emblema original saiu do cabeçalho e foi
  ampliado ao lado de YOKIRA e “Acervo de animes” na abertura**. No celular,
  Início usa o ícone de navegação. O desenho PNG permanece idêntico; corpo e
  cabeça da cobra animam com movimentos mais amplos em loop de 3,2 segundos.
  Preservar essa composição e a preferência do sistema por movimento reduzido.
- Layout usa toda a largura com margens proporcionais, até 3440×1440 e além;
  catálogo limita tamanho dos cards e aumenta as colunas. Primeiro colocado
  dos rankings anima cartão e retrato/avatar.
- Chat global flutuante sempre visível, fixado à direita e acima da barra móvel.
  Leitura pública; conta ativa envia texto/foto. Sem vídeo, HTML ou URL de mídia
  arbitrária. Rascunhos preservados, UUID de retry e suspensão/bloqueios no SQL.
- Fotos, avatar e banner em R2 privado com rotas próprias. Até 4 MiB, JPEG/PNG/WebP
  reais e estáticos, limites de frequência/cota. Avatar público; banner segue
  privacidade. Não reaproveitar upload de outra conta ou finalidade.
- Cartão por mouse/toque/teclado com nível, destaques salvos, banner autorizado e
  atividade consentida; acesso ao perfil completo e amizade. Compartilhar o que
  assiste começa desligado. Episódios ocultos/futuros/arquivados não vazam.
- Dono pode compartilhar novamente convites no chat, trancar/destrancar ou encerrar
  sala. Cartões não revelam convite secreto; entrada é revalidada atomicamente.
- Admin tem aba de moderação do chat global com motivo/auditoria. Moderador pode
  ocultar/restaurar; somente admin pode editar o texto.
- Migração incremental `0016_comunidade_global`: fotos, chat, atividade e campos
  de perfil/trava, com schema/snapshot/journal coerentes. Migração testada também
  com progresso existente, empate de horários, órfãos e compartilhamento desligado.
- Revisão seguinte já aplicada: chat sem convites evita carregar todo o acervo;
  substituir uma foto limpa o anexo anterior; Salvar perfil aguarda uploads;
  chat só aceita clique após hidratação e recolhe ao navegar para perfil/sala.
- Validação: 133 testes backend, typecheck, lint sem erros, audit sem alto/crítico,
  builds produção/prévia. CI: 30 testes Chromium passaram diretamente e um passou
  após repetição automática no primeiro carregamento do banner; três cenários
  duplicados foram omitidos intencionalmente. Inclui leitura/envio/retry do chat,
  cartão/perfil, trava de salas, marca realmente em movimento e 320–3440px:
  https://github.com/AnderHonorato/Yokira-2.0/actions/runs/42170409804.
  Capturas de 390px e 3440px foram inspecionadas. Login real interativo e envio de
  arquivos reais por conta de produção não foram simulados.

## Auditoria e complemento publicados na versão 11

- Publicação Sites 11 confirmada no mesmo link; origem
  `27660b04f6dbe5c1fc904da8feb5b8c43a6d96aa`; ambiente revisão 2.
  Código GitHub `53bfb92`, relatório em `docs/auditoria-yokira-20261106.md`.
- **Falha real de produção no sino:** a segunda consulta de conquistas usava
  106 parâmetros; D1 permite 100. Regras agora usam JSON e consultas com 41/47
  parâmetros. Marcação/reivindicação de até 200 IDs usa grupos de 80 dentro do
  mesmo lote. O teste `conquistas-d1.test.mjs` impõe o limite da hospedagem.
- Pedido/aceite de amizade geram histórico privado no sino, atômico e idempotente
  por ciclo. Pedido abre `/?p=amizades&aba=recebidas` com allowlist de aba. Eventos
  sociais não disparam celebrações nem alteram claims de conquistas/níveis.
- Convidados suspensos saem das salas alheias e liberam a vaga; reativação não
  os reinsere automaticamente. O dono preserva sua associação para gerir após
  reativação. Conteúdo retirado não impede mais o dono de encerrar suas salas;
  o resumo de gestão não devolve vídeo, conversa ou convite privado.
- Uploads administrativos bloqueiam Salvar e troca de destino, mantêm Cancelar
  disponível e possuem timeout real/geração para ignorar respostas antigas.
- Evolução de nível incorpora marca original/cobra/YKA. Emblemas públicos animam;
  marca/emblemas/camadas CSS dos cenários pausam fora da tela e em aba oculta.
- Barra e troca dos banners usam o mesmo relógio; pausa preserva o restante e
  atualização sem mudanças não reinicia a contagem. Slogans restantes removidos.
- Migrações incrementais 0017/0018, snapshots/journal coerentes. 148 testes backend
  passaram; TypeScript, lint sem erros, build e db:generate aprovados. CI:
  https://github.com/AnderHonorato/Yokira-2.0/actions/runs/42204674890.
  Chromium: 50 casos passaram diretamente, um após retry no carregamento inicial
  do banner, cinco duplicados omitidos intencionalmente. Novos fluxos aprovados.
- **Conteúdo ainda não abastecido:** consulta pública encontrou 20 títulos e zero
  episódios/fontes publicados. Não confundir cadastro/player implementado com
  vídeos disponíveis. Foi perguntado ao usuário qual título e links cadastrar.
- Próximas entregas reais: gestão global de categorias/gêneros; criação de novos
  editoriais; UI para arquivar/restaurar banners; upload retomável >100 MiB/pacote
  HLS; envio real de e-mails para verificação/recuperação. Ver relatório detalhado.

## Perfil personalizável publicado na versão 12

- Sites 12 publicado no mesmo link, origem
  `18a4d6b41ff196a3635a27c7738b7cce51debb18`, ambiente revisão 2. Código GitHub
  `ea7c190` e ajuste `5566483`. Documento: `docs/perfil-personalizavel.md`.
- Perfil próprio e público compartilham capa cinematográfica, avatar sobreposto,
  moldura equipada, nível/XP com a marca original, bio, privacidade e atividade
  autorizada. O cartão do chat reflete capa/moldura conforme acesso.
- Quinze opções de capa/moldura/aura, incluindo iniciais e imagem pessoal.
  Desbloqueios usam conquistas persistidas ou nível do banco. Nenhuma compra
  ou assinatura foi criada. IDs/atributos adicionais/recompensas bloqueadas
  são rejeitados, com autorização revalidada dentro do UPDATE.
- Perfil próprio tem Meu hall e Personalizar vitrine, prévia antes de salvar,
  filtros da coleção e três destaques ordenáveis. O público recebe somente os
  destaques equipados autorizados, sem inventário privado completo.
- Migração `0019_personalizacao_perfil`: JSON de três IDs, preserva banners
  anteriores como capa pessoal e clientes antigos que omitem visual. Escolher
  preset conserva a URL da imagem própria somente para restauração pelo dono;
  o DTO público e a rota de imagem não liberam a capa pessoal não equipada.
- Movimento de capa, aura, moldura, partículas e pedestais usa transform/opacity,
  pausa fora da tela/aba e respeita movimento reduzido. Preservar PNG original,
  identidade Yokira e regras de fundo global exclusivo do admin.
- 157 testes backend, TypeScript, lint sem erros, build e migração/snapshot19
  aprovados. CI: https://github.com/AnderHonorato/Yokira-2.0/actions/runs/42292399005.
  Chromium concluiu 58 casos diretamente e um após retry no carregamento inicial
  do banner; cinco duplicados omitidos. Oito cenários novos de perfil passaram,
  cobrindo 320–3440px, prévia/retry/salvar/recarregar, hall e movimento reduzido.
  Capturas de público 390/1440/3440px, próprio e editor foram inspecionadas.
- Naquela entrega, fluxos autenticados foram exercitados com fixtures no CI,
  sem simular usuário em produção. Confira as instruções atuais do ambiente
  antes de escolher a ferramenta de navegador.

## Perfil compacto publicado na versão 14

- Correção explícita do usuário: o perfil estava grande e com cards demais.
  Sites 14 publicado no mesmo link, fonte
  `13c2478b73ebe63e1a459bfdc834a2287fe08e3c`, ambiente revisão 2.
  A versão 13 foi apenas salva, sem publicar.
- Capa 96/120/144px, retrato 58/72px e XP integrado à identidade. Destaques em
  faixa de até três emblemas, sem pedestais ou espaços vazios simulando prêmios.
  Coleção em linhas compactas, inicialmente Obtidas, com detalhes expansíveis.
- Atalhos viraram links em uma linha; abas são discretas, com sublinhado. Editor
  usa opções de recompensa horizontais; foto/capa e privacidade ficam recolhidas.
  Preservar quinze opções, desbloqueios, privacidade, persistência e animações.
- Grid mantém três destaques lado a lado no tablet. Primeiro teste detectou
  194px de altura em 768px; o ajuste passou no limite de 155px da fixture.
- 157 testes backend, TypeScript, lint sem erros e build aprovados no CI da
  revisão compacta. Dezesseis casos locais de perfil/movimento passaram em
  Chromium, cobrindo 320–3440px, salvar/retry/reload, hall, expansão de controles,
  animação original e pausa fora da tela. Capturas públicas, próprias e editor
  inspecionadas. Não alegar aprovação integral de um CI ainda pendente.
- O teste de movimento rola a seção estável, pois um emblema em loop nunca fica
  estável para scrollIntoViewIfNeeded; espaço de rolagem é controlado somente no
  teste. Não restaurar cards grandes para acomodar suposições antigas de teste.
- Produção verificada: home/chat/banners/marca 200, áreas e escritas protegidas
  anônimas 401, imagem inexistente 404; hash do PNG original preservado. Nenhuma
  identidade de produção foi simulada. Não houve migração ou mudança de backend.

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
- Leia as habilidades atuais do ambiente gerenciado e use o navegador
  integrado quando disponível. As instruções de 07/11 permitem Chromium e
  Playwright; as capturas desta entrega vêm do Chromium no CI. Não aplique
  proibições antigas de navegador a um ambiente cujas instruções mudaram.

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
