# Contas, conquistas e salas

O código desta revisão está em `versao-sites`. O link público permanece
https://yokira-2-ander.honoratoann.chatgpt.site. Publicar o GitHub não publica
automaticamente o repositório próprio do Sites.

## Fluxos disponíveis

- Meu perfil: cadastro e login por e-mail/senha ou ChatGPT, identidade pública,
  `@` único, privacidade, nível, hall de 20 conquistas e três destaques editáveis.
- Amizades: busca por nome ou `@`, pedidos, aceitar, recusar, cancelar, remover e
  bloquear. Perfis começam privados; o usuário pode permitir a busca no perfil.
- Salas: dupla até duas pessoas ou grupo até doze, episódio publicado específico,
  convite privado, conversa, expulsão, bloqueio de novas entradas e encerramento pelo dono.
- Reprodução sincronizada: o dono controla o player nativo; posição e revisão
  ficam no servidor. Convidados precisam autorizar a reprodução no navegador.
  Iframes de terceiros não oferecem controle universal de tempo; a interface
  informa essa limitação e mantém conversa e escolha dos players disponíveis.
- Administração: aparência global, banners com cenário/personagem separados,
  tempo padrão e tempo individual de 3 a 60 segundos, ordem e ativação. Mensagens
  das salas podem ser ocultadas/restauradas pela moderação e editadas por admin.

## Identidade e segurança

O login ChatGPT continua pertencendo ao dispatch Sites e usa seus caminhos
reservados. O cadastro adicional solicitado usa better-auth, adaptador Drizzle,
sessões no D1 e cookies HttpOnly/Secure/SameSite. `BETTER_AUTH_SECRET` e
`BETTER_AUTH_URL` são configurados no ambiente do Sites, nunca no código.

Contas por senha usam IDs `conta:...` e não se fundem automaticamente com contas
ChatGPT. E-mail declarado no cadastro não concede administração. A promoção por
`YOKIRA_ADMIN_EMAILS` continua exigindo identidade ChatGPT confiável do dispatch.
Regras de papel, suspensão, associação às salas e capacidade são revalidadas no
SQL. Alterações administrativas registram motivo e auditoria na mesma transação.

Não há serviço de envio de e-mails configurado. O cadastro não declara o endereço
como verificado e não oferece recuperação de senha até existir um remetente real.
Não inserir chaves ou senhas de serviços no chat ou no repositório.

As notificações de conquistas e níveis mantêm o histórico e a reivindicação única
entre abas/dispositivos. Origem de notificação aceita somente rotas locais
conhecidas; um link para sala nunca contém seu convite secreto. Bloquear alguém
remove a associação necessária à sala no mesmo lote, preservando a gestão do dono.

## Dados e operação

Migrações incrementais `0011_contas` até `0016_comunidade_global`, com snapshots e journal
correspondentes. Não alterar migrações que já tenham sido aplicadas. O schema foi
dividido em `db/esquema-*.ts`, reunidos por `db/schema.ts`.

As imagens de banner enviadas ao R2 ficam privadas até um banner ativo de título
visível referenciá-las. Upload, Range e HEAD seguem a autorização existente.
Salas consultam o servidor a cada dois segundos, com recuo em falhas. Mensagens
são limitadas; a tela mostra as 80 mais recentes e o servidor mantém até 500 por sala.

Verificações da revisão: `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm build`,
`pnpm build:preview`, `pnpm audit --prod --audit-level=high` e `pnpm db:generate`.
O último comando deve informar que não há alteração de schema pendente.

O CI Sites executa Chromium para validar as telas. No ambiente gerenciado sem
`cua_repl.js`, não iniciar outro navegador local nem afirmar QA visual interativa.

## Aparência e movimento

O fundo com dez cenários continua exclusivo do admin e é compartilhado por todos.
O carrossel de banners é uma configuração separada. Ambos respeitam movimento
reduzido; efeitos fora da tela e em abas ocultas são suspensos quando aplicável.
A navegação móvel reúne os controles em uma única barra inferior, com uma única
instância do sino. O emblema original em `/marca/emblema-192.png` é preservado;
somente sua região da cobra recebe animação em loop. O banner móvel usa cerca
de 244 px e a abertura da página foi compactada.
Níveis evoluem em oito faixas, com refinamento dentro de cada faixa e limite de
partículas; emblemas de conquistas distinguem cor, forma, desenho e raridade.

## Chat global e perfis enriquecidos

O chat flutuante fica encostado na direita, acima da barra inferior móvel. Todos
podem ler; contas ativas podem enviar texto e fotos. A consulta ocorre a cada
quatro segundos apenas quando o painel e a aba estão visíveis, com cancelamento
e recuo em falhas. O envio preserva o rascunho e reutiliza seu UUID em retries.
A listagem traz até 60 mensagens; bloqueios e suspensões são aplicados no servidor.

Fotos, avatar e banner usam `/api/comunidade/imagens`. O cliente redimensiona e
converte para imagem estática; o servidor valida JPEG/PNG/WebP real, até 4 MiB,
4096 px por dimensão e 16 megapixels. Limites: cinco tentativas por minuto,
20 imagens por dia e 100 MiB por conta. SVG e imagens animadas são rejeitados.
O R2 permanece privado: a rota libera somente a imagem vinculada a mensagem
visível, avatar atual, banner autorizado ou prévia do proprietário/moderação.
Avatares são públicos; o editor explica isso. Banners seguem a privacidade do perfil.

Nome e avatar abrem um cartão por mouse, toque ou teclado, com nível, destaques
salvos e atividade autorizada. O perfil completo acrescenta bio, XP e data de
entrada. Compartilhar o que está assistindo exige consentimento explícito e
perfil público, amizade ou acesso próprio. Conteúdo não publicado não aparece.
A migração recupera a última atividade de episódios conhecida; o compartilhamento
permanece desligado por padrão. Nenhuma resposta expõe URL de vídeo ou e-mail.

Somente o dono compartilha ou compartilha novamente a sala no chat. Os cartões
não contêm o convite privado: a entrada passa por uma mensagem pública válida,
com nova checagem de conta, bloqueios, publicação, capacidade e trava no SQL.
Trancar impede novas entradas e preserva os participantes atuais. Encerrar
invalida os cartões já publicados. Admin/moderador pode ocultar/restaurar mensagens;
somente admin edita texto, com motivo obrigatório e auditoria atômica.

## Telas amplas

O conteúdo acompanha a largura da janela com margens proporcionais, mantendo
cartões de catálogo com tamanho limitado e ampliando as colunas disponíveis.
Rankings reorganizam-se em telas amplas; o primeiro colocado recebe movimento
no cartão e na foto. A marca usa três recortes da mesma imagem original para
mover corpo e cabeça da cobra, com pausa fora da tela, aba oculta e movimento
reduzido. Não substituir a imagem nem criar outra barra de navegação móvel.
