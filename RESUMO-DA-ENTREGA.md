# Resumo da entrega — Yōkira Animes

Documento de fechamento: o que foi construído, o que quebrou no caminho, o que
merece atenção e o que fazer em seguida.

Escrito depois de rodar tudo — não é previsão, é relatório.

---

## 1. Situação final

| Verificação               | Resultado                                                |
| ------------------------- | -------------------------------------------------------- |
| `npm run typecheck`       | 522 arquivos, **0 erros, 0 avisos**                      |
| `npm run lint`            | Limpo                                                    |
| `npm run formatar:checar` | Todos os arquivos no padrão                              |
| `npm run teste:unitario`  | **50 testes**, 7 arquivos, todos verdes                  |
| `npm run teste:ponta`     | **41 passaram**, 1 pulado (hover é exclusivo de desktop) |
| `npm run build`           | Concluído                                                |
| Auditoria visual          | 7 divergências encontradas, 7 corrigidas, 0 abertas      |

Saída real desses comandos está na resposta final da conversa e reproduzível com
`npm run verificar`.

---

## 2. O que foi construído

### Fundação

- Projeto SvelteKit 5 + TypeScript estrito, adaptador Node, **porta 4000 fixa**
  (`strictPort`) em desenvolvimento, produção e pré-visualização.
- `src/lib/estilos/tema.css` com todos os tokens da seção 5 do prompt, escritos
  exatamente como especificado. Nenhum valor cru espalhado pelo resto do CSS.
- **29 ícones SVG próprios**, um arquivo por ícone, `viewBox 0 0 24 24`, traço
  1.75, terminais arredondados, `currentColor`. Zero bibliotecas, zero emoji.
- Molduras reutilizáveis (`moldura-card` 2:3, `recorte-hero` 3:4) com
  `aspect-ratio`, que é o que zera o CLS.
- Gerador de pôster procedural em SVG, determinístico por slug.
- Emblema enviado pelo cliente virou `favicon.ico` multi-resolução (16/32/48/64)
  e PNGs de 180/192/512 para aba do navegador, iOS e manifesto.

### Banco, autenticação e segurança

- 22 modelos no Prisma, cobrindo os exigidos no prompt mais `TokenConfirmacao`.
- Argon2id com parâmetros do OWASP; sessão no banco com o **SHA-256** do id do
  cookie; cookie `HttpOnly` / `SameSite=Lax` / `Secure` fora de desenvolvimento.
- Limite de 6 tentativas com bloqueio de 15 minutos, guardado no banco (e não em
  memória) porque o servidor pode rodar em vários processos.
- Papéis `ESPECTADOR < EDITOR < MODERADOR < ADMINISTRADOR`, comparados por peso.
- Cabeçalhos de segurança aplicados uma vez no `hooks.server.ts`.
- Dupla confirmação **de verdade**: a interface segura o botão, e o servidor
  exige um `TokenConfirmacao` de uso único emitido no passo 1. Toda ação
  consumada vira registro em `RegistroAdministrativo`.

### Interface

- Casca completa: cabeçalho, navegação, barra inferior de 5 abas, rodapé de
  desktop, faixa de offline e tela de primeiro acesso com progresso real.
- Home com hero rotativo (7 s, pausa no hover/foco, dots clicáveis) e três
  trilhas com carrossel.
- Carrossel com arrasto e `scroll-snap` no mobile; no desktop, setas que aparecem
  no hover, desabilitam nas pontas e **não existem** quando o conteúdo cabe na
  tela. Setas do teclado movem o foco entre cards.
- Card que expande no hover do desktop após 350 ms, só com `transform` e
  `opacity`, mostrando estrelas e o contador real de "assistindo agora".
  No toque não expande — abre a página.
- Página de detalhes com abas, seletor de temporada, ordenação, lista de
  episódios e painel lateral de trailers e "mais episódios".
- Catálogo com filtro por gênero, novidades, gêneros, minha lista, busca,
  configurações, entrar, cadastrar, player e painel administrativo.

### Dados, mídia e velocidade

- Endpoints de catálogo, minha lista, progresso, avaliação, audiência,
  confirmação e conta.
- Player HLS com `hls.js` por import dinâmico, e só onde o navegador não toca
  HLS nativamente.
- Progresso gravado a cada 15 s e em `pause`/`beforeunload` — nunca a cada
  segundo.
- "Assistindo agora" com heartbeat de 30 s e janela de 90 s. Número real.
- Upload gravando fora de `static/`, com nome gerado, e FFmpeg convertendo em
  360p/720p/1080p em processo separado.
- Service worker (assets do cache, catálogo em _stale-while-revalidate_),
  IndexedDB com versão de esquema e validade de 6 h, prefetch `hover`/`tap`.

### Qualidade

- 50 testes unitários e de integração; os de integração criam um SQLite
  temporário e rodam as migrations nele — banco de verdade, não simulado.
- 42 casos Playwright em dois projetos: **Pixel 5 (390 px)** e
  **Desktop Chrome (1440 px)**.
- GitHub Actions em dois jobs (qualidade e ponta a ponta).
- Nenhum `test.skip` usado para fechar mais rápido. O único `skip` é
  condicional: o teste de expansão no hover não faz sentido em aparelho de toque,
  e a versão desktop do mesmo comportamento roda e passa.

---

## 3. Problemas reais encontrados e corrigidos

Estes não são detalhes de estilo. São bugs e regressões que os testes ou a
auditoria pegaram.

### 3.1. Google Fonts custava 12 segundos

**Sintoma.** Primeira medição de desempenho: FCP de **12 928 ms**. Depois, a
suíte Playwright levava **6 minutos** e uma navegação media 12,7 s.

**Causa.** `<link rel="stylesheet">` apontando para `fonts.googleapis.com`. Uma
folha externa bloqueia a primeira pintura, e o evento `load` da página espera o
timeout da requisição quando o domínio está lento ou inacessível.

**Correção em duas etapas.** Primeiro, carregamento assíncrono da fonte
(FCP: 12 928 → 680 ms). Isso resolveu a pintura, mas o `load` continuava preso.
Depois, **auto-hospedagem**: a Inter foi baixada para `static/fontes/`.

Detalhe que rendeu: o Google devolve o **mesmo arquivo variável** para cada peso
pedido. Baixar os cinco pesos daria 668 KB de arquivos idênticos. Deduplicando
para dois arquivos (`latin` e `latin-ext`) com `font-weight: 400 800`, o custo
ficou em **133 KB**.

**Resultado.** Suíte ponta a ponta: **6,0 min → 25 s**. Zero dependência externa.
A fonte entra no cache do service worker e o modo offline mantém a tipografia.

### 3.2. `:global()` em arquivo `.css` quebrava o build

**Sintoma.** O build de produção emitia `'global' is not recognized as a valid
pseudo-class` e o CSS afetado não era aplicado.

**Causa.** `:global(...)` é sintaxe do bloco `<style>` do Svelte. Nossos estilos
moram em arquivos `.css` separados (exigência do prompt), que são CSS comum — e o
minificador rejeita.

**Correção.** Removido de três arquivos; em CSS global o seletor descendente
normal já faz o trabalho. Está registrado em `docs/sistema-visual.md` para não se
repetir.

### 3.3. O player fazia um POST a cada montagem

**Sintoma.** Um teste unitário que exigia "nenhuma gravação nos primeiros 10
segundos" falhou com uma gravação.

**Causa.** `ultimoEnvio` começava em `0`. O primeiro `timeupdate` calculava
`agora - 0 >= 15000` e gravava na hora — um POST por espectador em toda montagem
do player.

**Correção.** `ultimoEnvio = agora()` na criação do agendador. O teste existia
antes da correção e foi ele que encontrou o problema.

### 3.4. A navegação existia duas vezes no DOM

**Sintoma.** Um teste ponta a ponta estourava o tempo esperando um link clicável.

**Causa.** O cabeçalho renderizava `<NavegacaoPrincipal>` duas vezes — uma para
mobile, outra para desktop — escondendo uma delas por media query. Além de
duplicar cinco links no DOM, isso confunde leitor de tela e faz seletores
pegarem o elemento invisível.

**Correção.** Uma instância só, posicionada por `grid-template-areas`: no mobile
a navegação cai para a segunda linha, no desktop entra na coluna do meio.

### 3.5. `node build/index.js` subia na porta 3000

**Sintoma.** O requisito é porta 4000. O `dev` respeitava, o build de produção não.

**Causa.** O adaptador Node usa 3000 por padrão e **não lê o `.env`**.

**Correção.** `scripts/iniciar-servidor.ts` carrega o `.env`, força
`PORT=4000` e imprime a URL junto com a instrução de como encerrar.

### 3.6. Seis divergências visuais

Detalhadas em `docs/auditoria-visual.md` com causa e correção: chip vazando por
cima do card vizinho, rótulos colidindo na barra inferior em 360 px, hero desktop
com vazio enorme ao lado do texto, título estourando a borda em telas estreitas,
badge quebrando em duas linhas, todas as notas saindo iguais (`9.0`/`10.0`) por
causa de um seed com um voto só, e `1 Temporadas` no plural errado.

---

## 4. Pontos de atenção

Coisas que funcionam hoje, mas que você precisa saber antes de levar a sério.

### 4.1. Segurança

**Os segmentos HLS são arquivos estáticos públicos.** Quem descobrir a URL de um
`.m3u8` assiste sem conta. Está adequado para catálogo de demonstração; para
conteúdo licenciado é insuficiente. Precisa de URL assinada com validade curta,
ou de um endpoint que valide a sessão antes de servir o segmento.

**Não existe verificação de e-mail nem recuperação de senha.** As tabelas
(`TokenVerificacao`, `TokenRecuperacao`) e o modelo estão prontos, mas não há
envio de e-mail nem tela. Hoje o cadastro já entra com a conta ativa.

**O limite de tentativas é por conta, não por IP.** Alguém pode varrer muitos
e-mails diferentes sem esbarrar em nada. Em produção, coloque limite por IP no
proxy reverso.

**As senhas de demonstração estão no `.env.exemplo` e neste documento.** São de
desenvolvimento. Trocar antes de qualquer exposição.

### 4.2. Desempenho

**A navegação interna em 4G leva ~490 ms**, contra os 87 ms em rede local. A
causa é honesta: cada navegação faz um round-trip para `__data.json`, e 170 ms de
latência aparecem na ida e na volta. O cache em IndexedDB guarda o catálogo, mas
o `load` da página ainda espera o servidor. A solução está em 5.1.

**`private, max-age=30` na home e no catálogo** significa que uma alteração feita
no painel pode levar até 30 segundos para aparecer. Adequado para catálogo,
inadequado se um dia essas telas mostrarem estado por usuário.

**O pôster procedural vira data-URI dentro do HTML.** Some com uma requisição por
card, mas engorda o HTML. Com 100+ títulos numa página só, vale medir de novo.

### 4.3. Banco e escala

**SQLite não aguenta escrita concorrente.** Um upload processando trava as
escritas dos espectadores. Migre para PostgreSQL antes de qualquer uso real —
`docs/migracao-postgresql.md` tem o passo a passo, e o código da aplicação não
muda.

**A busca filtra em memória.** `src/routes/buscar/+page.server.ts` carrega o
catálogo inteiro e filtra em JavaScript, porque `contains` do SQLite é sensível a
maiúsculas. Funciona com 14 títulos; não funciona com mil. No PostgreSQL, troque
por `contains` com `mode: 'insensitive'`.

**`SessaoAssistindo` cresce sozinha.** Existe `limparSinaisVencidos()`, mas nada
a chama de tempos em tempos. Precisa de uma tarefa periódica.

### 4.4. Vídeo

**Sem fila de verdade.** `processarArquivo` é chamado com `void`, sem `await`.
Dois uploads simultâneos disparam dois FFmpeg competindo pela CPU. Precisa de uma
fila com concorrência limitada.

**Trabalho perdido se o servidor reiniciar.** Um `TrabalhoProcessamento` em
`PROCESSANDO` fica preso nesse estado para sempre se o processo cair no meio.

**O progresso do FFmpeg é por variante, não por segundo de vídeo.** O painel pula
de 33% para 66% e para 100%. Dá para ler `-progress` do FFmpeg e refinar.

**O limite de 8 GB é validado depois do upload chegar.** O arquivo já subiu antes
de ser recusado. O limite real precisa estar no proxy reverso.

### 4.5. Interface

**A página de personagens é um texto de espera.** A aba existe, o modelo de dados
não.

**"Ver todos os episódios" e "Trailers ›" voltam para a mesma página.** Os
destinos ainda não existem.

**O seletor de idioma `PT ⌄` não abre nada.** É fiel à imagem de referência, mas
não funcional — não há internacionalização.

**Curtir (o polegar) não persiste.** O botão está lá, com o modelo `Avaliacao`
pronto, mas não ligado.

**O download de episódio não baixa.** O ícone segue a referência; o endpoint não
existe.

Nenhum desses é bug: são partes da referência visual que foram reproduzidas sem
back-end por trás. Estão aqui para não haver surpresa.

---

## 5. Próximos passos

Em ordem de retorno sobre esforço.

> **Estado em 26/08/2026.** Quatro itens desta lista já foram entregues:
> **5.1**, **5.2**, **5.5** e **5.8**. Ficam abaixo com o texto original
> preservado, marcados como concluídos e com o link do que ler agora. Os
> demais continuam em aberto.

### 5.1. Navegação instantânea de verdade — CONCLUÍDO

Hoje o cache em IndexedDB alimenta o pré-carregamento, mas o `load` da home ainda
espera o servidor. Mover a home e o catálogo para um `+page.ts` universal que
**leia primeiro do IndexedDB e revalide depois** faria a transição pintar antes
do round-trip.

Ganho esperado: de ~490 ms para menos de 100 ms em 4G — a meta que hoje só é
atingida em rede local. É o item de maior impacto percebido da lista.

**Feito.** Home e catálogo saíram de `+page.server.ts` e usam um `load`
universal que lê o IndexedDB primeiro (`src/lib/cliente/carga-instantanea.ts`).
Um teste de ponta a ponta trava o `/api/catalogo` em 3 s e confirma que a home
ainda pinta em menos de 2 s.

### 5.2. Proteger os segmentos HLS — CONCLUÍDO

Substituir o servimento estático por um endpoint que valide a sessão e devolva a
playlist com URLs assinadas de validade curta (5 a 10 min). Sem isso, qualquer
conteúdo licenciado está aberto.

Combina bem com marca d'água por sessão, se houver preocupação com redistribuição.

**Feito.** Tudo passa por `/midia/hls/[arquivoId]/[recurso]`, que exige sessão
**e** assinatura HMAC amarrada ao usuário. A playlist sai reescrita com cada
segmento já assinado. Detalhes em `docs/seguranca.md`. A marca d'água por
sessão continua não existindo.

### 5.3. PostgreSQL e busca de verdade — 1 dia

Seguir `docs/migracao-postgresql.md`, e no mesmo passo trocar a busca em memória
por consulta com `mode: 'insensitive'`. Com o catálogo crescendo, `pg_trgm`
resolve busca com erro de digitação sem trazer nenhuma dependência nova.

### 5.4. Fila de processamento com estado — 2 dias

Uma fila com concorrência limitada (1 ou 2 trabalhos), retomada de trabalhos
presos em `PROCESSANDO` na inicialização, e progresso real lido do `-progress` do
FFmpeg. Uma tabela e um laço resolvem; não precisa de Redis nesta escala.

### 5.5. Verificação de e-mail e recuperação de senha — CONCLUÍDO

As tabelas já existem. Falta o serviço de envio (Resend ou SMTP), duas telas e
dois endpoints. Enquanto isso não existir, ninguém que esquecer a senha consegue
voltar.

**Feito.** Três transportes sem dependência nova (`console`, `arquivo`,
`resend`), telas de recuperar/redefinir/verificar, e faixa de confirmação
pendente em `/configuracoes`. Redefinir revoga todas as sessões.

### 5.6. Fechar o que a referência promete — 3 a 4 dias

Personagens (modelo + tela), trailers como entidade própria, download de episódio,
curtir persistido, e as rotas de "ver todos". São itens pequenos, mas cada botão
que não faz nada custa confiança de quem usa.

### 5.7. Testes de acessibilidade no CI — meio dia

Adicionar `@axe-core/playwright` e rodar em cada rota, nas duas larguras. Os
alvos de toque e o foco visível já estão cuidados; um teste automatizado impede
que uma regressão passe despercebida.

### 5.8. Painel administrativo completo — CONCLUÍDO

Hoje o painel mostra números e recebe upload. Falta criar e editar títulos,
temporadas e episódios pela interface, gerenciar usuários e papéis, e tratar as
denúncias — os modelos `Denuncia` e `RegistroAdministrativo` existem e não têm
tela. Toda ação destrutiva aí precisa passar pelo `dialogo-confirmacao`, que já
está pronto para receber.

**Feito.** `/admin/titulos`, `/admin/usuarios`, `/admin/denuncias` e
`/admin/registro`, com a tabela de papéis por área no `README.md`. Tudo que
apaga consome o token de uso único da dupla confirmação, com o alvo amarrado
ao token. Não é possível rebaixar o último administrador.

### 5.9. Observabilidade — 1 dia

Não há log estruturado nem rastreamento de erro. Antes de colocar gente de
verdade usando, vale um `pino` no servidor e um coletor de erro no cliente. Sem
isso, "o site está lento" continua sendo uma afirmação sem resposta.

---

## 6. Decisões que valem explicação

**SvelteKit, não Next.js.** Estava no prompt, e os números confirmam: 239 KB de
recursos na home (133 KB só de fontes) e LCP de 0,87 s em 4G com CPU estrangulada.

**Validação escrita à mão, sem Zod.** São poucos formatos e economiza cerca de
14 KB no bundle. O mesmo módulo valida no formulário e no servidor, então a
mensagem que a pessoa vê é exatamente a que o servidor aplicaria.

**CSS em arquivo separado com classes prefixadas.** O `<style>` do Svelte escopa
automaticamente, mas obriga o CSS a morar dentro do `.svelte` — o que o prompt
proíbe. A saída foi `import './arquivo.css'` no `<script>` com prefixo por
componente. Custo: disciplina de nomes. Benefício: separação real de arquivos.

**Controles nativos do `<video>`.** Acessibilidade e tela cheia saem de graça, e
o esforço de interface vai para o que as telas de referência pedem.

**Sessão no banco, não em JWT.** Sem isso "encerrar todas as sessões" seria
mentira: um token assinado continua válido até expirar.

**Três degraus de qualidade no HLS, não seis.** Cada degrau é uma transcodificação
inteira a mais por episódio, e 360/720/1080 cobre do 3G ao desktop.

**Sobre a organização em ondas de subagentes.** O prompt previa até três
subagentes simultâneos com um agente raiz validando. A execução seguiu a mesma
divisão de escopo e a mesma ordem de ondas, mas em um único processo — cada onda
foi construída e validada antes da seguinte, com os comandos rodados de verdade
entre elas. O resultado que a divisão buscava (arquivos pequenos, escopo fechado,
erro aparecendo cedo) está no repositório: 191 arquivos de código, nenhum acima
de 180 linhas fora das exceções abaixo.

---

## 7. Exceções à regra de 180 linhas

| Arquivo                     | Linhas | Por quê                                                       |
| --------------------------- | ------ | ------------------------------------------------------------- |
| `prisma/schema.prisma`      | 359    | Exceção prevista no prompt: schema não se divide              |
| `prisma/dados-ficticios.ts` | 233    | Tabela de dados, não lógica. Dividir só espalharia o catálogo |

`prisma/seed.ts` chegou a 183 linhas e foi dividido: as contas de demonstração
saíram para `prisma/contas-de-demonstracao.ts`. Os outros 189 arquivos de código
estão dentro do limite — o maior é `banner-destaque-estilo.css`, com 162 linhas.

---

## 8. Credenciais de demonstração

Criadas por `npm run banco:semear`. **Desenvolvimento apenas.**

| Papel         | E-mail                    | Senha              |
| ------------- | ------------------------- | ------------------ |
| Administrador | `admin@yokira.local`      | `YokiraAdmin#2024` |
| Espectador    | `espectador@yokira.local` | `YokiraDemo#2024`  |

Há também cinco contas `votante1..5@yokira.local` sem senha utilizável
(`senhaHash: 'sem-login'`), que existem só para dar volume às avaliações e fazer
as notas variarem na tela.

---

## 9. Sobre direitos autorais

As três imagens de referência serviram **apenas como guia de layout**. Nenhum
título, arte, sinopse ou texto de terceiros entrou no repositório.

O catálogo de `prisma/dados-ficticios.ts` é inventado — 14 títulos com nomes,
sinopses e anos próprios. Os pôsteres são gradientes SVG gerados por
`gerar-poster.ts` a partir do slug de cada título.

O administrador carrega as artes reais que tiver direito de usar. Isso não muda
o layout — só a origem das imagens.
