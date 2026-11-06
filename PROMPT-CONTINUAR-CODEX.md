# Prompt para continuar o Yokira no Codex 6.1 Sol

Copie o texto abaixo para a nova sessão. O histórico técnico público está em
`CONTINUAR-COM-OUTRA-IA.md`; ele não substitui um link compartilhado da conversa.

```text
Continue o desenvolvimento do meu Yokira usando GPT Codex 6.1 Sol como
orquestrador. Autorizo dividir tarefas independentes entre agentes, integrar
as alterações e revisar o resultado. Use o modelo solicitado quando disponível;
se não estiver disponível, informe isso sem fingir que trocou de modelo.

ACESSO E CONTEXTO
Site publicado para visualizar e comparar:
https://yokira-2-ander.honoratoann.chatgpt.site
Você precisa acessar esse link como referência visual antes de alterar a interface.
Mantenha-o no início das atualizações de publicação. Não confunda prévia local
com atualização desse site público.

Repositório: https://github.com/AnderHonorato/Yokira-2.0
Branch de continuidade: sol/identidade-login-temas-20261105
PR existente: https://github.com/AnderHonorato/Yokira-2.0/pull/21
Contexto técnico atualizado:
https://raw.githubusercontent.com/AnderHonorato/Yokira-2.0/refs/heads/sol/identidade-login-temas-20261105/CONTINUAR-COM-OUTRA-IA.md

PASTA E CÓPIA
Localize no meu computador a pasta documentos/projetos-lil/Yokira, respeitando
o caminho real e a capitalização do sistema. Insira nela uma cópia completa e
atualizada do meu Yokira 2.0, incluindo versao-sites e os recursos versionados.
Confira primeiro os arquivos existentes, git status, branch e remotos. Preserve
alterações locais, dados e arquivos pessoais; não sobrescreva nem apague trabalho
existente. Se a pasta estiver vazia, clone diretamente nela a branch indicada.
Se já houver projeto, compare e integre com cuidado, evitando pastas duplicadas.
Não copie node_modules, caches, builds ou credenciais de outra máquina; instale
as dependências pelo lockfile e configure os dados locais separadamente.

APLICAÇÃO CORRETA E ORGANIZAÇÃO
O site do GPT usa versao-sites: React/TypeScript, Vinext, Cloudflare D1 e R2.
A raiz contém outra aplicação SvelteKit/Prisma. Alterar só essa raiz não atualiza
o site publicado. Leia AGENTS.md aplicáveis, README, CONTINUAR-COM-OUTRA-IA.md,
versao-sites/README.md e versao-sites/docs/EVOLUCAO-SOCIAL.md. Diferencie regras
da aplicação antiga das convenções e exceções documentadas de versao-sites.

Mantenha a estrutura existente:
- versao-sites/app/componentes: componentes e seus arquivos CSS próximos;
- versao-sites/app/api: rotas e validação de transporte;
- versao-sites/lib: contratos, tipos e funções compartilhadas;
- versao-sites/lib/servidor: regras, consultas, autorização e testes do servidor;
- versao-sites/db: schema e conexão; drizzle: migrações e metadados;
- versao-sites/public: recursos visuais; docs: documentação;
- testes/sites-mobile: testes de navegador da aplicação publicada.
Organize por responsabilidade e funcionalidade, aproveitando módulos existentes.
Use português nas novas mensagens, nomes e documentação; sem emojis. Prefira
arquivos pequenos, até 180 linhas, respeitando exceções já documentadas. Separe
CSS do componente e use os tokens existentes. Não misture autenticação, consulta,
animação e interface em um arquivo gigante; não crie pastas genéricas ou cópias
de componentes quando a estrutura atual já atender. Atualize referências ao mover
arquivos. Não imponha convenções Svelte a arquivos React.

VISUAL: PRESERVAR O PADRÃO EXISTENTE
Continue a identidade atual: paleta, tipografia, proporções, espaçamentos, botões,
cards, navegação e estados de interação. Não redesenhe o site, não troque framework
nem adicione bibliotecas apenas por preferência. Toda tela nova, inclusive admin,
deve parecer parte do mesmo produto. Preserve acessibilidade, foco, teclado,
contraste, carregamento, vazio, falha, retry e dados preenchidos após erro.

O emblema original de cobra/katana/YKA fica GRANDE ao lado de YOKIRA e “Acervo
de animes” na abertura. Preserve /marca/emblema-192.png e seu desenho; não invente
outra cobra. Corpo e cabeça têm movimento real em loop de 3,2 segundos, não só
brilho. Mantenha a preferência do sistema por movimento reduzido. Não recoloque
um emblema duplicado no cabeçalho. A marca pública é Yokira, sem 2.0.
No celular, preserve uma única barra inferior integrada e banners compactos.
No ultrawide 3440x1440, aproveite a largura com margens proporcionais e cards
bem dimensionados. Teste também 320, 390, 768 e 1440 px, sem sobreposição ou
rolagem horizontal. Animações e transições devem ser fluidas e consistentes.
Não volte a adicionar slogans/frases de efeito removidos.

FUNCIONALIDADES A PRESERVAR E CONCLUIR
- Dez cenários animados: somente admin escolhe e a escolha vale para todos.
- Admin completo para usuários, moderação, filmes, séries, categorias, temporadas,
  episódios, publicação e fontes de vídeo: R2, Google Drive, nuvem e players
  incorporados. Todas as fontes ativas ficam disponíveis para o usuário escolher.
- Banners com personagens/cenários, ordem e intervalo configuráveis pelo admin.
- Contas, @ único, sugestões, senhas fortes, amizades, bloqueios e privacidade.
- Conquistas com raridades e emblemas animados, hall e três destaques; evolução
  visual de nível; celebração uma única vez e histórico seguro nas notificações.
- Primeiro colocado dos rankings com animação no card e no retrato/avatar.
- Chat global sempre visível à direita, leitura pública e envio autenticado
  somente de textos/fotos; cartão de perfil por mouse/toque/teclado com banner,
  nível, destaques e atividade consentida, amizade e acesso ao perfil completo.
- Salas em dupla/grupo, conversa, convites compartilháveis novamente pelo dono,
  trava/destrava e encerramento. Não exponha o convite privado no chat público.

AMBIENTE, NAVEGADOR, HABILIDADES E PLUGINS
Use habilidades e plugins disponíveis que ajudem de fato: GitHub, Sites,
navegador integrado, frontend, backend, banco, segurança e testes. Leia as
instruções relevantes antes de usar; não suponha ferramentas ou acessos ausentes.
Inicie o servidor no ambiente conectado à pasta e abra a URL da prévia no
navegador integrado para acompanhar em tempo real. Siga versao-sites/README.md
e o perfil de execução do ambiente; prepare D1/R2 locais e migrações necessárias.
Use pnpm com o lockfile existente. Não inicie servidor duplicado se já houver
uma prévia válida. Informe o link real da prévia assim que estiver disponível.
O processo servidor roda no ambiente; o navegador integrado exibe a aplicação.
Se o ambiente não oferecer essa prévia/navegador, informe a limitação e use o
fluxo de validação suportado, sem alegar que abriu ou testou o que não executou.

SEGURANÇA, VERIFICAÇÃO E ENTREGA
Preserve better-auth e login ChatGPT, autorização no servidor, privacidade,
limites de upload, validação de imagens e auditoria. Não promova admin pelo
e-mail não verificado do cadastro. Não publique segredos nem simule identidade
de usuário em produção. Não reescreva migrações aplicadas; acrescente migrações
incrementais com schema/snapshots/journal coerentes. Não resete o banco real.
E-mail de verificação/recuperação ainda depende de um serviço de envio real;
players externos não oferecem sincronização universal de reprodução.

Último estado confirmado nesta entrega: Sites versão 11, origem
27660b04f6dbe5c1fc904da8feb5b8c43a6d96aa; 148 testes backend aprovados.
CI visual aprovado, incluindo animação medida e telas de 320 a 3440 px:
https://github.com/AnderHonorato/Yokira-2.0/actions/runs/42204674890
Confira novamente o estado atual, pois pode haver alterações posteriores.

Execute typecheck, testes relevantes, lint e build de produção. Inspecione a
interface renderizada no navegador e os fluxos reais; não entregue só telas
decorativas. Revise segurança e integração das tarefas dos agentes. Documente
o que funcionou, o que foi testado e limitações reais. O Sites tem repositório
próprio: publicar no GitHub sozinho não atualiza seu endereço. Para publicar,
use o projeto existente em .openai/hosting.json, mantendo o mesmo link; não crie
outro site. Não publique uma cópia incompleta sobre a versão que está funcionando.

Comece pela cópia local e pela prévia visual; compare com o site publicado,
identifique pendências concretas e continue as atualizações sem refazer o que
já está pronto. Compartilhe progresso objetivo e entregue o link verificável.
```
