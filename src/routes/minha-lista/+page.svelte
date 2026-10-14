<!-- Arquivo: src/routes/minha-lista/+page.svelte -->
<script lang="ts">
  import '../grade-titulos.css';
  import CartaoConteudo from '$componentes/home/cartao-conteudo.svelte';
  import BotaoPill from '$componentes/comum/botao-pill.svelte';

  export let data;
</script>

<svelte:head><title>Minha Lista — Yōkira Animes</title></svelte:head>

<h1 class="pagina-titulo">Minha Lista</h1>

{#if data.precisaEntrar}
  <p class="pagina-subtitulo">Entre na sua conta para montar e sincronizar a sua lista.</p>
  <BotaoPill variante="marca" href="/entrar">Entrar</BotaoPill>
{:else if data.itens.length === 0}
  <p class="grade-vazia">Sua lista está vazia. Use “+ Minha Lista” em qualquer título.</p>
{:else}
  <ul class="grade-titulos">
    {#each data.itens as item (item.id)}
      <CartaoConteudo {item} />
    {/each}
  </ul>
{/if}
