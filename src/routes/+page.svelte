<!-- Arquivo: src/routes/+page.svelte -->
<!-- Home: hero rotativo + trilhas Populares / Em alta / Novidades (imagens 1 e 2). -->
<script lang="ts">
  import BannerDestaque from '$componentes/home/banner-destaque.svelte';
  import TrilhaConteudo from '$componentes/home/trilha-conteudo.svelte';
  import { onMount } from 'svelte';
  import { gravar } from '$cliente/cache-sessao';
  import { CHAVE_DO_CATALOGO } from '$cliente/precarregamento';

  export let data;

  // Na primeira visita o `load` executa no servidor; a hidratação também precisa
  // persistir o catálogo público para que a próxima navegação use o cache.
  onMount(() => {
    void gravar(CHAVE_DO_CATALOGO, data.catalogo).catch(() => {});
  });

  // O `load` devolve o cache na hora; a revalidacao chega depois e troca o objeto
  // so quando o conteudo mudou de verdade. A geracao evita que uma resposta atrasada
  // de uma navegacao anterior sobrescreva a tela atual.
  let catalogo = data.catalogo;
  let geracao = 0;

  $: sincronizar(data);

  function sincronizar(atual: typeof data) {
    const minha = ++geracao;
    catalogo = atual.catalogo;
    void atual.atualizacao?.then((fresco) => {
      if (fresco && minha === geracao) catalogo = fresco;
    });
  }
</script>

<svelte:head>
  <title>Yōkira Animes — Início</title>
  <meta
    name="description"
    content="Catálogo de animes com legendas em português no Yōkira Animes."
  />
</svelte:head>

<BannerDestaque destaques={catalogo.destaques} />

{#each catalogo.trilhas as trilha, indice (trilha.chave)}
  <TrilhaConteudo {trilha} prioritaria={indice === 0} />
{/each}
