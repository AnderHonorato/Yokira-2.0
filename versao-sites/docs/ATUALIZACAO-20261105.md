# Yokira — administração e publicação GPT

O endereço permanece https://yokira-2-ander.honoratoann.chatgpt.site.
O GitHub e a hospedagem Sites têm repositórios de origem separados. Um merge no
GitHub não publica sozinho nesse endereço; é necessário salvar e implantar a
versão correspondente no projeto Sites existente.

## Usar o painel

1. Entrar com ChatGPT em `/?p=perfil`.
2. Administradores acessam `/?p=acervo-admin` para criar séries e filmes, editar
   títulos e editoriais, imagens, categorias/gêneros e disponibilidade.
3. Salvar o título e usar a seção de temporadas e vídeos abaixo. Filmes usam
   vídeo único; séries organizam episódios por temporada e ordem.
4. Cadastrar as fontes de cada vídeo: arquivo MP4/WebM/HLS, Google Drive ou URL
   de player incorporado. Fontes ativas aparecem juntas na página de reprodução.
5. Para arquivos próprios, usar o envio do dispositivo. Vídeos aceitam MP4/WebM;
   imagens aceitam PNG/JPEG/WebP/AVIF. Cada envio tem limite de 100 MiB. Arquivos
   maiores podem usar URLs do servidor ou armazenamento externo.
6. Publicar quando estiver pronto. Rascunhos, arquivos arquivados, temporadas
   arquivadas, títulos ocultos e estreias futuras não oferecem reprodução pública.

O Drive precisa permitir acesso ao arquivo. Players externos precisam permitir
incorporação; o link para abrir o provedor fica disponível. A retomada de posição
por conta funciona no player nativo. O tempo interno de iframes de outros
provedores não é controlado pela Yokira.

## Pessoas, comunidade e histórico

`/?p=admin` reúne usuários, papéis, suspensão/reativação, conteúdo, denúncias e
auditoria. Administradores editam textos, nomes e papéis; moderadores podem cuidar
da disponibilidade e das denúncias. Ações administrativas exigem motivo e são
registradas. O banco impede remover ou suspender o último administrador ativo.

As notificações são privadas por conta. Conquistas e níveis têm registro
idempotente; a celebração é reivindicada no servidor uma única vez, inclusive
entre abas e dispositivos. O sino mantém o histórico e o caminho de origem.
Níveis conquistados por publicação/resposta apontam para a participação que
concedeu XP. O XP e as permissões são calculados no servidor.

## Configuração e segurança

- D1 usa o binding `DB`; os arquivos usam R2 no binding `BUCKET`.
- `YOKIRA_ADMIN_EMAILS` é configuração secreta do Worker no Sites. Somente e-mails
  confiáveis injetados pelo dispatch podem receber administração por essa regra.
- A identidade usa os cabeçalhos do Sites; papéis enviados pelo cliente não
  alteram autorização. O acesso administrativo é reconferido na escrita SQL.
- Uploads verificam identidade, origem, formato e tamanho real durante streaming.
  GET/HEAD da mídia suporta Range e reconfere disponibilidade; arquivos de
  rascunhos não são publicados só por conhecer seu endereço.
- Incorporações recebem apenas URLs HTTPS validadas, sem HTML arbitrário. O iframe
  usa sandbox e não recebe os dados pessoais ou credenciais da conta Yokira.
- Os dez cenários e a marca têm animações em loop e respeitam movimento reduzido.
  O seletor de cenários também oferece pausa e escolha manual.

## Validação e recuperação

Executar em `versao-sites`: `pnpm run typecheck`, `pnpm test`, `pnpm run lint` e
`pnpm run build`. Testes exercitam as rotas e o adaptador D1 com SQLite, incluindo
persistência, autorização, moderação, catálogo, fontes, notificações e retomada.

As migrações são incrementais e preservam dados. As já aplicadas não devem ser
reescritas. Em reversão, publicar uma versão anterior e manter as tabelas novas;
não apagar conteúdo ou executar migrações destrutivas para reverter a interface.

A verificação hospedada inclui HTTP da página, catálogo, artes e recusa de dados
pessoais sem login. O fluxo interativo de login e a reprodução de provedores
externos autenticados precisam de verificação com a conta e os arquivos reais.
