# Continuidade — para retomar o projeto em outra conversa

Este arquivo existe para que uma conversa nova comece de onde a anterior parou,
sem refazer levantamento nem repetir decisões. Ele **não descreve o produto** —
isso está no `README.md` e no `RESUMO-DA-ENTREGA.md`. Aqui fica só o que vive na
cabeça de quem trabalhou e se perde quando a conversa acaba.

## Como usar

Leia, nesta ordem:

1. Este arquivo inteiro (é curto).
2. `RESUMO-DA-ENTREGA.md` §4 (pontos de atenção) e §5 (próximos passos).
3. `README.md` só quando precisar rodar alguma coisa.

Não releia o código inteiro para "entender o projeto". Ele tem 581 arquivos
verificados e as convenções abaixo valem em todos.

## Onde parou

- Branch de trabalho: `claude/promo-yokira-anexado-cs3xqu`
- Último commit: `c53cc31` — corrige contraste do tema claro e corrida no hero
- Árvore limpa, tudo empurrado para o GitHub
- Verificação no último commit: **581 arquivos, 0 erros**, lint e formatação
  limpos, **130 testes unitários**, **87 testes de ponta a ponta** (1 pulado)

Nada está pela metade. É seguro começar coisa nova.

## Regras duras do projeto

Estas não são preferências — são as regras que o código inteiro já segue.
Quebrar qualquer uma delas cria inconsistência com 581 arquivos.

- **Tudo em português**: nomes de arquivo, funções, variáveis, rotas, mensagens
  de commit, comentários. Sem exceção.
- **Sem emoji**, em lugar nenhum.
- **Máximo de 180 linhas por arquivo.** As exceções estão listadas e
  justificadas em `RESUMO-DA-ENTREGA.md` §7. Não crie exceção nova sem
  documentar ali.
- **CSS em arquivo `.css` separado**, nunca `<style>` dentro do `.svelte`.
- **Nenhuma cor crua.** Só tokens de `src/lib/estilos/tema.css` e
  `tema-claro.css`. A única exceção viva é o `#000` do letterbox em
  `player-video.css`, que é correto nos dois temas.
- **Sem biblioteca de ícones**: os 29 ícones são SVG próprio.
- **Sem `alert()`, `confirm()` ou `prompt()`.** O feedback visual passa por
  `src/lib/cliente/avisos.ts`.
- **Validação escrita à mão** em `src/lib/validacoes/`. Sem Zod nem similar.
- **Svelte 5 na sintaxe antiga** (`export let`), não runes. O projeto é
  consistente nisso; misturar os dois estilos é pior do que qualquer um deles.
- **Nada de conteúdo de terceiros versionado** (capas, vídeos, fontes).
- Acesso ao banco passa por `src/lib/servidor/banco/`. Sete rotas ainda
  importam `banco/cliente` direto (`admin`, `admin/enviar`, `api/admin`,
  `api/midia/playlist`, `assistir/[episodioId]`, `configuracoes`,
  `redefinir-senha`) — isso é dívida conhecida, não exemplo a seguir.

## Decisões já tomadas — não relitigar

- **Escuro é o tema padrão** de quem nunca escolheu. Claro e automático existem
  e são escolhidos em `/configuracoes`. O tema é injetado no HTML pelo servidor
  via `transformPageChunk` em `hooks.server.ts`, justamente para não piscar.
- **O hero da home e o banner da página de título são deitados também no
  celular.** Foi pedido explicitamente. Não "corrija" isso para retrato.
- **As capas dos carrosséis são deitadas no desktop e em pé no celular.**
- **As ações da página de título ficam todas numa linha só.** Já foi ajustado
  uma vez porque o botão de curtir tinha caído sozinho embaixo.
- **As setas do carrossel aparecem no hover, nas bordas esquerda e direita**,
  só no desktop. Elas cobrem 68 px dos cartões das pontas — isso foi medido com
  `elementFromPoint` e considerado aceitável, porque é o padrão de carrossel e
  o degradê sinaliza o controle. Se for mudar, é decisão de produto, não bug.
- **HLS nunca dentro de `static/`.** `pastaDeHls()` em
  `src/lib/servidor/midia/caminhos.ts` lança erro se apontarem para lá, porque
  os segmentos seriam servidos sem sessão nem assinatura.
- **A suíte de ponta a ponta tem banco próprio** (`midia/teste.db`). Antes ela
  sujava o `dev.db` — 254 usuários, cada um com um hash Argon2, deixando a
  suíte mais lenta a cada rodada.
- **O ambiente de execução é um container isolado na nuvem.** Ele não é
  alcançável pela rede local de ninguém: IP `192.0.2.2` (TEST-NET-1), sem
  entrada e sem túnel. Não prometa "abrir no celular" a partir dele.

## Armadilhas descobertas na prática

Cada uma destas custou tempo. Estão aqui para não custar de novo.

- **Nunca use `pkill -f "node build/index.js"`**: o padrão casa com o próprio
  shell e mata a sessão (saída 144). Use
  `pgrep -f "build/index[.]js" | xargs -r kill`.
- **O banco real é `/home/user/yokira-animees/dev.db`**, não `prisma/dev.db`
  (que existe e está vazio). Apontar o `DATABASE_URL` para o errado dá 500 em
  tudo.
- **`use:enhance` reseta o formulário por padrão.** Isso fazia o rádio de tema
  voltar para a opção anterior. Solução:
  `use:enhance={() => async ({ update }) => update({ reset: false })}`.
- **O vitest não resolve os aliases do SvelteKit** sem `resolve.alias` no
  `vitest.config.ts`. Se um módulo de servidor precisa ser testado, ou ele não
  importa alias, ou o alias entra na config.
- **`page.goto('/sair')` não desloga**: a rota é só POST. Clique no botão.
- **Um build de produção recusa o segredo de sessão de exemplo** e devolve 500
  onde você espera 403. É comportamento correto (falha fechada). O
  `playwright.config.ts` já passa um `SEGREDO_SESSAO` real.
- **Cuidado com teste que passa sem testar nada.** Dois casos reais: um teste
  do admin afirmava uma URL que já casava _antes_ do clique, e o `page.goto`
  cancelava o DELETE em voo; um teste de tema conferia o atributo que o próprio
  cliente tinha acabado de escrever de forma otimista, em vez do cookie. Sempre
  espere um sinal real de conclusão.
- **Corpo de função `async` roda de forma síncrona até o primeiro `await`.** Um
  teste meu afirmava a propriedade errada por causa disso.
- **O Prisma recusa `migrate reset` sem consentimento explícito.** É guarda de
  segurança; não contorne.
- **Ler `atual.id` depois de um `await`** no hero é corrida: o destaque troca a
  cada 7 s e no celular não há hover para pausar. Capture o alvo antes.

## Pendências, em ordem

### 1. Duas frentes de análise que nunca entregaram

Da segunda orquestração, três agentes morreram no limite de sessão. A revisão
de código eu fiz à mão depois (resultou no commit `c53cc31`). **Faltam duas**,
e não existe resultado nenhum delas — não presuma que existe:

- **SEO, PWA e compartilhamento**
- **Arquitetura e dados para escala**

### 2. Backlog de 50 itens, já levantado

Está no artefato [Backlog Yōkira](https://claude.ai/code/artifact/c2d71c5a-252f-4b00-9614-355db3616d8e).
São defeitos e melhorias encontrados varrendo o site inteiro, com exemplo em
cada um. **Não refaça esse levantamento.** Ficou combinado consolidar o
artefato separando _conserto_ de _novidade_ — isso ainda não foi feito.

Quatro itens do levantamento já foram corrigidos: o HLS dentro de `static/` no
README, 27 cores cruas fora dos tokens, o contraste do texto terciário e o
`tabela-admin.css` de 295 linhas.

### 3. Doze propostas de produto, já pesquisadas

Vieram do único agente da segunda orquestração que sobreviveu, e os fatos que
as sustentam foram conferidos: `Episodio.publicadoEm` nunca é filtrado em lugar
nenhum; `Historico` só é escrito (a cada 15 s) e apagado em massa, nunca lido;
`Visualizacao` é tabela indexada que nunca recebeu uma linha; e
`Titulo.popularidade` é número escrito à mão que ordena a trilha "Populares".

As três de melhor retorno, todas **sem schema novo**, porque o dado já existe e
ninguém lê:

- **Agendamento de estreia no painel.** `publicadoEm` só sabe ser `now()`,
  então cadastrar uma temporada publica os 12 episódios de uma vez. Falta um
  argumento em `criarEpisodio` e um `where: { publicadoEm: { lte: new Date() } }`
  nas consultas. É também um defeito latente: se alguém preencher a data no
  banco, o episódio futuro aparece hoje como se já tivesse estreado.
- **Sequência de dias assistidos.** Usa o `Historico` que já acumula e o índice
  `[usuarioId, vistoEm]` que já está pago. Cuidado: a sequência não pode quebrar
  por fuso — precisa da data local, não `UTC` cru.
- **Trilhas "Porque você viu X".** `recomendacoesPara()` já existe mas só roda
  na página de detalhes. Tem que ser **endpoint separado**: `/api/catalogo` é
  `public, max-age=300` e o service worker o intercepta, então trilha
  personalizada ali envenenaria o cache compartilhado.

As outras nove (calendário de estreias, retenção por episódio, importação em
lote, relações entre títulos, sinalizações por episódio, mural com marca de
tempo, retrospectiva pessoal, coleções curadas, ranking semanal) pedem schema
novo em maior ou menor grau.

### 4. Do backlog original do `RESUMO-DA-ENTREGA.md` §5

Concluídos: 5.1, 5.2, 5.5, 5.8. **Abertos**: 5.3 (PostgreSQL e busca de
verdade), 5.4 (fila de processamento com estado), 5.6 (fechar o que a
referência promete), 5.7 (acessibilidade no CI), 5.9 (observabilidade).

## Como verificar antes de empurrar

```bash
npm run verificar          # typecheck, lint, formatação e testes unitários
rm -f midia/emails-teste.jsonl midia/teste.db
npx playwright test        # ponta a ponta, dois perfis: celular-390 e desktop-1440
```

Em ambiente com o Chromium fora do lugar padrão, prefixe com
`CHROMIUM_EXECUTAVEL=/caminho/para/chrome`.

As duas suítes passavam inteiras no commit `c53cc31`. Se alguma falhar, é
regressão de algo escrito depois — não é ruído conhecido.
