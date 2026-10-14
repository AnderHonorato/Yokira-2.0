# Desempenho — Yōkira Animes

Números medidos no **build de produção** (`npm run build && npm run iniciar`),
não em desenvolvimento. Máquina de medição: container Linux, 4 vCPUs.

## Como foi medido

Chromium via CDP, viewport de 390 px, com:

- rede 4G simulada — 9 Mbps de descida, 170 ms de latência;
- CPU estrangulada em 4× (aproxima um celular intermediário);
- LCP e CLS capturados por `PerformanceObserver` com `buffered: true`.

O script fica em `docs/medir-desempenho.mjs`.

## Resultados

| Métrica                           | Meta     | Medido                                            | Situação        |
| --------------------------------- | -------- | ------------------------------------------------- | --------------- |
| LCP (4G + CPU 4×)                 | < 2,5 s  | **0,68 s**                                        | Passa com folga |
| FCP (4G + CPU 4×)                 | —        | **0,68 s**                                        | —               |
| TTFB                              | —        | **25 ms**                                         | —               |
| CLS                               | < 0,1    | **0**                                             | Passa           |
| Resposta visual ao toque          | < 200 ms | **1–16 ms**                                       | Passa           |
| Peso de recursos da home          | —        | **108 KB**                                        | —               |
| Navegação para página já visitada | < 100 ms | **147 ms** sem estrangulamento · **464 ms** em 4G | Ver abaixo      |

### Sobre a navegação entre páginas

**87 ms** do clique até o conteúdo pintado, em rede local — dentro da meta.

Em 4G simulado o número sobe para ~490 ms, e a razão é honesta: a navegação
interna faz **um round-trip** para buscar `__data.json`, e os 170 ms de latência
aparecem na ida e na volta antes de qualquer renderização.

O que já está feito para reduzir isso:

- `data-sveltekit-preload-data` em `hover` no desktop e `tap` no mobile — em
  aparelho de toque `hover` nunca dispara, e a rota só começaria a carregar
  depois do clique;
- `cache-control: private, max-age=30` nos `load` da home e do catálogo, o que
  faz o retorno dentro da janela vir do cache do navegador;
- catálogo público espelhado em IndexedDB com validade de 6 h;
- service worker servindo assets do cache e o `/api/catalogo` em
  _stale-while-revalidate_.

O que **falta** para cravar abaixo de 100 ms em rede ruim está registrado em
`RESUMO-DA-ENTREGA.md`: fazer o `load` da home ler primeiro do IndexedDB e
revalidar depois, em vez de sempre esperar o servidor.

## Duas correções que valeram 12 segundos

A primeira medição deu **FCP de 12,9 s**. A causa era o `<link rel="stylesheet">`
do Google Fonts: uma folha de estilo externa bloqueia a primeira pintura, e em
rede lenta (ou sem acesso ao domínio) a página inteira fica esperando.

**Correção 1 — não bloquear a pintura.** A fonte passou a entrar de forma
assíncrona. FCP: **12 928 ms → 680 ms**.

Mas o problema não tinha acabado: o evento `load` da página continuava esperando
o timeout do CDN. A suíte ponta a ponta media **12,7 s** para uma navegação, e
cada teste pagava esse pedágio.

**Correção 2 — eliminar o terceiro.** A Inter foi auto-hospedada em
`static/fontes/`: dois arquivos variáveis (`latin` e `latin-ext`, 133 KB no
total) cobrindo os pesos 400 a 800.

O Google entrega o mesmo arquivo variável para cada peso pedido — baixar os cinco
pesos separadamente daria 668 KB de arquivos idênticos. Deduplicar para dois
arquivos com `font-weight: 400 800` custou 133 KB.

**A suíte ponta a ponta caiu de 6,0 min para 25 s.** A fonte também entra no
cache do service worker, então o modo offline agora mantém a tipografia correta.

O mesmo problema derrubava a tela de primeiro acesso, que esperava
`document.fonts.ready` — passo removido de `precarregamento.ts`.

Custo aceito: o LCP subiu de 0,68 s para 0,87 s, porque agora as fontes são
baixadas do nosso servidor em vez de virem (talvez) de um cache de CDN. Em troca:
zero dependência externa, funcionamento offline e nenhum timeout de terceiro.

## Decisões que sustentam os números

**SvelteKit em vez de Next.js.** Sem hidratação pesada: a home entrega 108 KB de
recursos no total, e o HTML já chega pintado do servidor.

**`aspect-ratio` em toda imagem.** `moldura-card` (2:3) e `recorte-hero` (3:4)
reservam o espaço antes de a imagem carregar. É daí que sai o CLS igual a zero.

**Pôster procedural em SVG.** Cabe no próprio HTML como data-URI, sem uma
requisição por card.

**Fonte auto-hospedada e variável.** Nenhuma requisição a domínio de terceiro no
caminho crítico, e um arquivo por subset em vez de um por peso.

**`hls.js` por import dinâmico.** Só carrega no player, e só em navegador que não
toca HLS nativamente — no Safari seriam ~150 KB jogados fora.

**Animações restritas a `transform` e `opacity`.** Compostas na GPU, sem
recalcular layout. `prefers-reduced-motion` desliga o movimento sem quebrar o
layout.

**Consulta de audiência em lote.** `contarAudienciaDeVariosTitulos` resolve as
três trilhas da home em uma consulta; a versão ingênua faria N+1.

## Reproduzir

```bash
npm run build
npm run iniciar          # http://localhost:4000
node docs/medir-desempenho.mjs
```

O script bloqueia `fonts.googleapis.com` de propósito: se alguma requisição
voltar a sair para lá, é regressão.
