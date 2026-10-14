<!-- Arquivo: src/routes/generos/+page.svelte -->
<script lang="ts">
  import '../grade-titulos.css';
  import './generos.css';

  export let data;
</script>

<svelte:head><title>Gêneros — Yōkira Animes</title></svelte:head>

<h1 class="pagina-titulo">Gêneros</h1>

<ul class="generos-grade">
  {#each data.generos as genero (genero.id)}
    <li>
      <a class="genero-cartao" href={`/catalogo?genero=${genero.slug}`}>{genero.nome}</a>
    </li>
  {/each}
</ul>
