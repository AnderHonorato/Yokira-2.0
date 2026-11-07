# Auditoria funcional do Yokira — 6 de novembro de 2026

Site: https://yokira-2-ander.honoratoann.chatgpt.site

Correções publicadas na versão Sites 11; origem
`27660b04f6dbe5c1fc904da8feb5b8c43a6d96aa`.

A revisão compara os pedidos do usuário com a aplicação `versao-sites`, o código
e as respostas públicas do site. A raiz Svelte é outra aplicação. Este relatório
não representa teste interativo de uma conta real de produção nem de todos os
players de terceiros.

## Pendência de conteúdo confirmada no site

A consulta pública encontrou **20 títulos, zero títulos com episódios, zero
episódios publicados e zero fontes ativas**, sem falhas HTTP. Os cadastros e
players já existem, mas ainda faltam episódios/filmes e suas fontes reais para
assistir. É uma pendência de abastecimento, separada de programação. O usuário
foi consultado sobre o primeiro título e os links/pasta dos vídeos. A demonstração
do player não substitui episódios cadastrados.

## Recursos existentes

| Área          | Situação verificada                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Identidade    | Marca Yokira sem 2.0; PNG original ampliado na abertura, YOKIRA e título ao lado; cobra em loop.                       |
| Telas         | Barra inferior única no celular, abertura/banner compactos e layout amplo até 3440 px.                                 |
| Aparência     | Dez cenários globais escolhidos somente por admin; personagens/cenários nos banners, ordem e intervalo configuráveis.  |
| Catálogo      | Criação e edição de séries/filmes, temporadas, episódios, rascunhos, estreias e arquivamento.                          |
| Reprodução    | Seleção de múltiplas fontes por episódio: R2, URL direta/HLS, Drive e incorporado.                                     |
| Contas        | Login por ChatGPT e e-mail/senha, @ único, sugestões, privacidade, amizades e bloqueios.                               |
| Conquistas    | Vinte feitos persistidos, raridades, hall com três destaques e reivindicação única das celebrações.                    |
| Comunidade    | Chat global visível sem login; contas ativas enviam textos/fotos; cartões e perfis respeitam privacidade.              |
| Salas         | Dupla/grupo, conversa, convite público sem segredo exposto, compartilhamento repetido, trava e encerramento pelo dono. |
| Administração | Papéis/suspensão, moderação de usuários, catálogo, publicações, respostas, chat e mensagens das salas, com auditoria.  |

## Correções e complemento desta revisão

- **Sino/conquistas no D1:** consulta de sincronização tinha 106 parâmetros, acima
  do limite de 100. Definições passaram a usar JSON, reduzindo a quantidade.
  Marcação/reivindicação de até 200 notificações foi dividida em statements de
  até 80 IDs, mantendo o lote atômico. Teste simula o limite real da hospedagem.
- **Amizades no histórico:** pedido/aceite agora geram notificação privada,
  idempotente por ciclo da relação. Pedido abre diretamente a aba Recebidas.
  Bloqueios/suspensões são revalidados; eventos sociais não disparam celebração.
- **Salas indisponíveis:** o dono continua vendo um resumo de gestão e pode
  encerrar, sem recuperar vídeo ou conversa de conteúdo retirado. Resolve o
  bloqueio de cinco salas abertas inacessíveis. Fechar exige dono ativo no SQL.
- **Vagas de suspensos:** convidado suspenso é retirado das outras salas e libera
  a vaga. Reativar a conta não o reinsere automaticamente. A associação do dono
  é preservada para que possa retomar a gestão ao ser reativado.
- **Uploads administrativos:** salvar/trocar destino fica bloqueado durante
  upload; cancelar permanece disponível. Timeout real e geração/identidade
  impedem resposta atrasada de alterar outro título, episódio, fonte ou banner.
- **Níveis e emblemas:** a evolução incorpora a marca original/cobra/YKA;
  destaques públicos animam. Marca, emblemas e camadas CSS dos cenários pausam
  fora da tela, em aba oculta e com preferência por movimento reduzido.
- **Banners:** um único relógio controla barra e troca. Pausar/retomar preserva
  tempo restante; consulta sem mudanças não reinicia o intervalo.
- **Texto:** removidas frases promocionais restantes em Detalhe/Reprodução.
- Migrações incrementais `0017_ciclo_salas` e `0018_notificacoes_sociais`, com
  snapshots/journal, preservam migrações e claims existentes.

## O que falta criar ou completar

| Prioridade             | Pendência                                      | Próxima entrega concreta                                                                                                                                 |
| ---------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alta                   | Catálogo sem episódios/fontes reais publicados | Receber/localizar os vídeos ou links, cadastrar temporadas/episódios/fontes e validar reprodução real. Não inventar URLs.                                |
| Alta                   | Categorias/gêneros sem gestão global           | Cadastro independente, renomeação/fusão e organização de categorias, integrado aos títulos e filtros. Hoje cada título tem uma lista textual de gêneros. |
| Alta                   | Verificação de e-mail e recuperação de senha   | Configurar serviço de envio real e concluir verificação/redefinição com links seguros. Nenhum e-mail declarado concede admin.                            |
| Média                  | Criar novos editoriais                         | Hoje admin edita editoriais existentes; falta criação completa integrada à listagem e leitura.                                                           |
| Média                  | Gestão de banners arquivados pela interface    | Disponibilizar arquivamento, listagem de arquivados e restauração com autorização/auditoria. Desativar e editar já existem.                              |
| Média                  | Vídeos maiores e upload retomável              | Superar o upload único de 100 MiB com partes/retomada, limites e limpeza; opcionalmente processar/transcodificar vídeo.                                  |
| Média                  | Envio de pacote HLS                            | Player HLS por URL já funciona; upload de playlist+segmentos e processamento ainda não existem.                                                          |
| Dependente do provedor | Sincronização de players incorporados          | O player nativo sincroniza; terceiros exigem API específica. A interface já explica a limitação.                                                         |

A ordem sugerida é publicar conteúdo real, completar categorias e recuperação de
conta, depois editoriais e mídia avançada. Preservar o visual atual em todas as
novas telas e manter backend, permissões e persistência integrados à interface.

## Validação da entrega

148 testes de backend aprovados, TypeScript, lint sem erros, build de produção
e migrações/snapshots válidos. O CI concluiu 50 casos Chromium diretamente e um
após retry no carregamento inicial do banner; cinco casos duplicados foram
omitidos intencionalmente. Novos fluxos de sino social, gestão de salas, uploads,
movimento dos emblemas e temporização dos banners passaram em suas matrizes.

https://github.com/AnderHonorato/Yokira-2.0/actions/runs/42204674890
