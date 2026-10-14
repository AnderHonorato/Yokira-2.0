<!-- Arquivo: src/routes/novidades/+page.svelte -->
<script lang="ts">
  import '../grade-titulos.css';
  import CartaoConteudo from '$componentes/home/cartao-conteudo.svelte';

  export let data;
</script>

<svelte:head><title>Novidades — Yōkira Animes</title></svelte:head>

<h1 class="pagina-titulo">Novidades</h1>
<p class="pagina-subtitulo">Episódios que entraram recentemente no catálogo.</p>

{#if data.itens.length === 0}
  <p class="grade-vazia">Nenhuma novidade no momento.</p>
{:else}
  <ul class="grade-titulos">
    {#each data.itens as item (item.id)}
      <CartaoConteudo {item} />
    {/each}
  </ul>
{/if}
