<!-- Arquivo: src/routes/buscar/+page.svelte -->
<script lang="ts">
  import '../grade-titulos.css';
  import './buscar.css';
  import CartaoConteudo from '$componentes/home/cartao-conteudo.svelte';
  import Lupa from '$visual/icones/lupa.svelte';

  export let data;
</script>

<svelte:head><title>Buscar — Yōkira Animes</title></svelte:head>

<h1 class="pagina-titulo">Buscar</h1>

<form class="busca-forma" method="GET" action="/buscar" role="search">
  <span class="busca-icone"><Lupa tamanho={18} /></span>
  <input
    class="busca-campo"
    type="search"
    name="q"
    value={data.termo}
    placeholder="Nome do título"
    aria-label="Nome do título"
  />
</form>

{#if data.termo.length >= 2 && data.itens.length === 0}
  <p class="grade-vazia">Nada encontrado para “{data.termo}”.</p>
{:else if data.itens.length > 0}
  <ul class="grade-titulos">
    {#each data.itens as item (item.id)}
      <CartaoConteudo {item} />
    {/each}
  </ul>
{/if}
