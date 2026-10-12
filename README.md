# Yōkira Animes 2.0 — branch `main-claude`

Plataforma de streaming de animes: front em **React + Vite** (leve, páginas carregadas sob demanda) e API em **Node + Express**. Tema **escuro e claro**, layout responsivo (desktop e mobile), código em português.

## Rodar

```bash
npm install          # instala web + servidor (workspaces)
npm run dev          # API em :3333 e site em http://localhost:5173
```

Produção (um único servidor entrega API e site):

```bash
npm run build && npm start   # http://localhost:3333
```

## O que tem

| Tela | Rota | Funções |
|---|---|---|
| Início | `/` | Vitrine rotativa com "continuar", placar da comunidade, números da temporada, atalhos, continuar assistindo, em alta (ranking), no ar, mais bem avaliados, próximas estreias, reta final, notícias |
| Acervo | `/acervo` | Busca + filtros (gênero, ano, temporada, formato, status, ordenação) na URL, paginação |
| Anime | `/anime/:slug` | Banner, capa, ações (assistir/continuar, lista, favorito), abas: visão geral, episódios, personagens, comunidade; ficha técnica e nota; relacionados |
| Assistir | `/assistir/:slug/:n` | Player próprio (atalhos de teclado, pular 10s, velocidade, miniplayer, tela cheia, próximo ep. automático), retomada de onde parou, marcação de assistido, lista lateral de episódios, avaliações |
| Agenda | `/agenda` | 7 dias com horários de lançamento |
| Top 100 | `/top100` | Ranking por nota com filtro por década |
| Minha lista | `/minha-lista` | Lista, favoritos e histórico (salvos no navegador) |
| Notícias | `/noticias`, `/noticias/:slug` | Destaque + lista e página de matéria |
| Busca | tecla `/` ou ícone | Sugestões enquanto digita |

## API (`/api`)

`GET /inicio` · `GET /animes?q&genero&ano&temporada&formato&status&ordem&pagina&limite` · `GET /animes/:slug` · `GET /animes/:slug/episodios/:n` · `GET|POST /animes/:slug/comentarios` · `GET /agenda` · `GET /top?decada=2020|2010|2000|antigos` · `GET /noticias` · `GET /noticias/:slug` · `GET /ranking` · `GET /filtros` · `GET /capa/:slug.svg?tipo=poster|banner|ep&n=`

## Dados

- `servidor/src/dados/gerar.js` cria um catálogo **fictício** (48 títulos, episódios, personagens, notícias). `npm run dados` regenera `banco.json`.
- Capas são SVG geradas pelo slug (sem imagens de terceiros).
- Vídeo: todos os episódios apontam para um vídeo de demonstração aberto. Troque `urlVideo` por episódio no `banco.json` ou defina `VIDEO_PADRAO` (veja `servidor/.env.exemplo`).
- Comentários são gravados em `servidor/src/dados/comentarios.json`.

## Próximos passos sugeridos

1. Login (JWT) e mover lista/favoritos/progresso do `localStorage` para a API.
2. Banco real (PostgreSQL/Prisma) no lugar do `banco.json`.
3. Vídeo em HLS (`.m3u8`) com `hls.js` e legendas `.vtt`.
4. Painel administrativo para cadastrar títulos e episódios.
5. Jogos da comunidade (quiz do dia, tier list, votação semanal) — previstos no layout de referência, não implementados aqui.

## Demo estática

`cd web && npx vite build -c vite.demo.config.js --mode demo` gera `web/dist-demo/index.html`: o site inteiro em um único arquivo, sem servidor (dados locais, rotas com `#`, vídeo de demonstração próprio embutido).

Referência de organização: `docs/REFERENCIA.md`.
