# Mapa de referência (análise de superanimes.com.br, 12/10/2026)

Levantamento feito por HTML, DOM e capturas de tela (desktop 1440px e mobile 390px). Serviu só para a **organização** das telas — nenhum código, CSS, texto ou imagem do site foi copiado. O visual segue os tokens Yōkira (fundo `#08080b`, roxo `#8b5cf6`, Inter) do artefato "Yōkira Animes — Telas".

## Observações sobre o site de referência
- É um **catálogo** (aponta para serviços oficiais em "onde assistir"); não hospeda episódios. A Yōkira 2.0 acrescenta o player e o fluxo de streaming.
- Feito em Next.js; muitos anúncios e popups fixos.

## Estrutura encontrada → o que fizemos
| Referência | Yōkira 2.0 |
|---|---|
| Topo: Início, Acervo, Agenda, Top 100, Editorial, Fórum, Comunidade (menu com jogos) + busca + login | Início, Acervo, Agenda, Top 100, Notícias, Minha lista + busca + tema |
| Gaveta mobile com links e área do usuário | Gaveta mobile com links e troca de tema |
| Hero com texto + placar de XP + números da temporada | Vitrine rotativa de streaming + placar + números |
| Faixa de jogos (Animedle, gacha, tier list…) | Faixa de atalhos (jogos ficam como próximo passo) |
| Em alta (cartões com posição), Shorts, Redação, No ar, Trailers, Top 100, A caminho, Despedida | Em alta, Continuar assistindo, No ar, Mais bem avaliados, Próximas estreias, Reta final, Notícias |
| Acervo: busca + selects em pílula (gênero, ano, temporada, formato, status, ordem) + paginação | Igual, com filtros na URL |
| Detalhe: banner, capa, nota, gêneros, lista/favoritar, abas (visão geral, trailer, elenco, onde assistir, episódios, trilha, wallpapers, comunidade, FAQ), lateral com pontuação e infos | Banner, capa, assistir/continuar, lista/favoritar, abas (visão geral, episódios, personagens, comunidade), lateral com nota e ficha |
| Agenda: abas por dia com contagem + itens com "adicionar" | Igual |
| Top 100: pílulas por década | Igual |
| Shorts: feed vertical | Não implementado |
