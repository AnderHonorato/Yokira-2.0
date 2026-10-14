# Segurança — Yōkira Animes

## Senhas

Argon2id via `@node-rs/argon2`, com os parâmetros do OWASP concentrados em
`src/lib/servidor/autenticacao/senha.ts`: `memoryCost 19456`, `timeCost 2`,
`parallelism 1`, saída de 32 bytes.

`conferirSenha` devolve `false` em qualquer exceção. Hash corrompido ou de outro
algoritmo é tratado como senha errada — nunca como sucesso.

Política mínima: 10 caracteres, misturando letras e números
(`src/lib/validacoes/conta.ts`). A mesma função valida no formulário e no servidor.

## Sessões

Sessão fica **no banco**, não em JWT. Sem isso, "encerrar todas as sessões" seria
mentira: um token assinado continua válido até expirar.

- O cookie carrega um id opaco de 32 bytes aleatórios em base64url.
- O banco guarda o **SHA-256** desse id. Quem lê o banco não consegue se passar por ninguém.
- Cookie com `HttpOnly`, `SameSite=Lax`, `Secure` fora de desenvolvimento, validade de 30 dias.
- Cookie apontando para sessão morta é apagado na hora, dentro do `hooks.server.ts`.
- `revogarTodasAsSessoes` marca `revogadaEm` em lote.

## Força bruta

Contador por usuário no próprio registro (`tentativasFalhas`, `bloqueadoAte`).
6 tentativas erradas bloqueiam a conta por 15 minutos. Está no banco, e não em
memória, porque o servidor pode rodar em mais de um processo.

Login com e-mail inexistente e login com senha errada devolvem **a mesma
mensagem** — caso contrário a tela viraria um oráculo de e-mails cadastrados.

## Dupla confirmação (e por que a interface não basta)

Um diálogo bonito não protege nada: qualquer pessoa chama a API direto no `curl`.
Por isso o fluxo tem duas metades.

**Na interface** (`dialogo-confirmacao.svelte`): passo 1 explica o que vai
acontecer; passo 2 exige ação ativa — digitar `EXCLUIR` ou marcar a caixa — com o
botão desabilitado até lá.

**No servidor**: o passo 1 chama `POST /api/confirmacao` e recebe um
`TokenConfirmacao` de uso único, com validade de 5 minutos, amarrado ao usuário,
à ação e opcionalmente ao alvo. O passo 2 gasta esse token. Chamar duas vezes com
o mesmo token dá erro — e essa é exatamente a graça.

Toda ação consumada é gravada em `RegistroAdministrativo`.

Ações cobertas: excluir conta, excluir título/temporada/episódio, remover usuário,
despublicar conteúdo, limpar histórico, limpar dados baixados, encerrar todas as
sessões, reprocessar vídeo publicado.

## Painel administrativo

O `+layout.server.ts` do `/admin` garante **EDITOR** para toda a área. Isso
protege a tela, não o dado: cada `action` e cada rota exige o papel de novo —
`/admin/usuarios` pede **ADMINISTRADOR**, `/admin/denuncias` e
`/admin/registro` pedem **MODERADOR**.

Tudo que apaga passa por `/api/admin`, que **consome o token de uso único** da
dupla confirmação antes de tocar no banco. O token é emitido com o `alvo`
junto, então um token emitido para apagar o título A não apaga o título B.

Trocar papel também passa pela dupla confirmação — promover alguém a
ADMINISTRADOR é, na prática, tão irreversível quanto apagar. E há uma trava:
**não é possível rebaixar o último administrador**. Sem ela, um clique errado
tranca todo mundo para fora do painel e só o banco resolve.

Toda ação consumada vira linha em `RegistroAdministrativo`, agora legível em
`/admin/registro`.

## Papéis

`ESPECTADOR < EDITOR < MODERADOR < ADMINISTRADOR`, comparados por peso em
`src/lib/servidor/permissoes/papeis.ts`. O painel administrativo é barrado uma
única vez, no `+layout.server.ts` de `/admin`, o que vale para toda subrota.

Promover alguém a administrador é feito por script de terminal
(`npm run banco:promover`), fora da interface: escalar privilégio por tela é
convite a acidente.

## CSRF e cabeçalhos

`csrf: { trustedOrigins: [] }` no `svelte.config.js` — o SvelteKit só aceita
POST/PUT/DELETE vindos da própria origem.

O `hooks.server.ts` acrescenta em toda resposta:
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`X-Frame-Options: DENY` e `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

Sair da conta é **POST**, nunca GET: uma tag `<img>` em site alheio não pode
deslogar ninguém.

## Upload

`src/lib/servidor/armazenamento/gravar-upload.ts` aceita só `.mp4`, `.mkv`,
`.mov` e `.webm`, limite de 8 GB, e grava com nome gerado por `randomUUID()` —
o nome enviado pelo usuário nunca vira caminho no disco.

O arquivo original vai para `midia/originais/` e os segmentos HLS para
`midia/hls/`, os dois **fora de `static/`**. Nada de mídia é servido como
arquivo estático.

## Mídia assinada

Todo `.m3u8` e todo `.ts` passa por `/midia/hls/[arquivoId]/[recurso]`, que
exige **as duas coisas**: sessão válida e assinatura válida.

A assinatura é um HMAC-SHA256 (`SEGREDO_SESSAO`) sobre
`arquivoId:recurso:usuarioId:expiraEm`. Amarrar o `usuarioId` é o que torna um
link vazado inútil para outra conta — quem receber a URL ainda precisaria do
cookie de sessão de quem gerou.

O nome do recurso passa por lista fechada
(`mestre.m3u8`, `\d{3,4}p.m3u8`, `\d{3,4}p_\d{3,5}.ts`), então não existe
travessia de caminho: nomes fora do padrão são recusados antes de o disco ser
tocado.

**Por que a playlist é reescrita.** O player resolve os nomes de dentro do
`.m3u8` relativos à playlist. Assinar só a playlist deixaria o pedido do
segmento chegar sem assinatura nenhuma. Por isso cada URI de dentro sai
assinada, em `src/lib/servidor/midia/playlist-assinada.ts`.

**Dois prazos, de propósito.** A playlist vale 10 minutos, e é pedida no
instante do play (`/api/midia/playlist`) — a página não carrega nenhuma URL de
mídia embutida, senão uma aba aberta por meia hora daria 403 no play. Os
segmentos valem 4 horas porque a playlist de VOD não é recarregada pelo
player: 10 minutos aqui matariam o vídeo no minuto 11.

Em produção o servidor **se recusa a assinar** com o `SEGREDO_SESSAO` de
exemplo. Falha fechada: sem segredo real, sem mídia.

## Verificação de e-mail e recuperação de senha

Os dois tokens ficam no banco como **SHA-256**, nunca em texto — mesma escolha
da sessão. Um backup vazado não redefine a senha de ninguém.

**Verificação** (24h): sai no cadastro, sem segurar a resposta — e-mail fora do
ar não pode impedir alguém de criar conta. A conta já entra usável; a
confirmação é cobrada numa faixa em `/configuracoes`, que também reenvia.
Pedir um link novo invalida o anterior.

**Recuperação** (1h, uso único): `/recuperar-senha` responde **sempre a mesma
coisa**, exista a conta ou não — tela diferente para e-mail cadastrado
transformaria a página num oráculo de contas. Um pedido por minuto por conta.

O `GET` de `/redefinir-senha` só confere o link; quem gasta o token é o `POST`.
Consumir no `GET` faria um pré-carregador de link de e-mail queimar o token
antes da pessoa digitar a senha. O gasto é um `updateMany` com
`usadoEm: null` na condição, então duas abas com o mesmo link: só uma passa.

Redefinir a senha **revoga todas as sessões**. Quem troca a senha por
recuperação pode estar expulsando um invasor; deixar as sessões antigas de pé
anularia o gesto.

Transportes de envio: `console` (padrão), `arquivo` (uma linha JSON por
mensagem, útil para conferir sem cliente de e-mail) e `resend` (HTTP direto,
sem dependência nova).

## O que ainda não está pronto

- Não há limite de requisições por IP no nível do servidor (só por conta).
  Em produção, coloque isso no proxy reverso.
- Não há marca d'água por sessão. Contra redistribuição por quem _tem_ acesso
  legítimo, a URL assinada não ajuda — isso é outro problema.
