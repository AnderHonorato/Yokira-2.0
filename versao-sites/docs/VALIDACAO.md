# Validação — Yokira 2.0

Atualização: 02/11/2026.

## Mudanças desta etapa

- Coleção pessoal: cinco situações de acompanhamento, episódios vistos, nota privada de 1 a 10, filtros, busca e ordenação. A marcação concluída preenche o total conhecido; títulos em andamento aceitam progresso sem total informado.
- Adição e remoção explícitas são idempotentes. A migração 0002 preserva títulos, usuários e datas anteriores.
- Player: retomada após carregamento tardio dos dados, progresso ao pausar/sair, atalhos restritos ao player, erros recuperáveis e HLS com seleção automática/manual via hls.js, com reprodução nativa quando MSE não está disponível.
- A fonte antiga de Big Buck Bunny retornou HTTP 403. Um trecho licenciado local de 30 segundos (01:00–01:30), com prévia, passou a demonstrar reprodução sem depender dessa URL. Créditos e alterações estão em DESIGN.md e na interface.
- Celular/tablet: tamanhos de texto e toque, contraste, navegação com Escape, foco, busca sem saltar a página nem criar uma entrada de histórico por letra. Idioma e tema persistem após recarregar.
- A página solicitada pela URL já é renderizada no servidor; links diretos não começam renderizando a home.

## Verificações executadas

- `tsc --noEmit`: aprovado.
- `node --test lib/servidor/*.test.mjs`: 15 testes aprovados, incluindo autenticação, CSRF, isolamento de contas, migração legada, limites de episódios/notas, operações idempotentes e jogos.
- `npm run lint`: zero erros; dez avisos da regra next/no-img-element. Os pôsteres são WebP locais, pequenos, com lazy loading; nenhum erro de lint ficou pendente.
- Migração 0002 executada com sucesso no D1 local.
- Navegador: layout em iframes reais de 320, 375 e 768 px, além do desktop de 1348 px. Sem overflow horizontal nas páginas medidas. Busca por Frieren, menu móvel/Escape e persistência de idioma e tema exercitados.
- Editor da coleção: inspecionado com dados sintéticos em rota temporária local, inclusive conclusão automática e preservação dos valores após erro 401. A rota e os dados sintéticos foram removidos antes da publicação. O fluxo autenticado de gravação foi verificado pelos testes reais da API; a sessão SIWC de produção não foi automatizada no navegador.
- Player: MP4 local reproduzido no viewport de 375 px. Teste isolado com mídia sintética confirmou retomada de 12 s recebida depois dos metadados, K para reproduzir/pausar, setas para avançar 10 s, M para som e entrega do progresso ao pausar. Um manifesto HLS local confirmou reprodução e seleção manual de 180p. Arquivos sintéticos foram removidos.
- Build de produção: executado pelo helper oficial Sites durante a preparação do pacote final.

## Limites atuais

O catálogo inicial reúne 20 títulos e quatro guias autorais. Top 100 é o formato do ranking, atualmente limitado aos títulos cadastrados. Agenda mostra anos; não há datas semanais confirmadas. Notas do catálogo são metadados de referência; notas pessoais ficam privadas. Comunidade inicia sem atividade fictícia.

Upload e transcodificação de episódios exigem a infraestrutura Node/FFmpeg da base original; não são executados no Worker. O vídeo local é somente um trecho aberto para demonstração. Nenhum episódio dos animes cadastrados é distribuído. Fullscreen nativo de iOS e redes móveis reais ainda precisam ser verificados em dispositivo físico.
