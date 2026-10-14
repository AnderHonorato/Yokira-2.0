<!-- Arquivo: src/routes/titulo/[slug]/+page.svelte -->
<!-- Pagina de detalhes da imagem 3: hero + abas + episodios a esquerda, painel a direita. -->
<script lang="ts">
  import './detalhes.css';
  import '../../grade-titulos.css';
  import CabecalhoTitulo from '$componentes/detalhes/cabecalho-titulo.svelte';
  import AbasConteudo from '$componentes/detalhes/abas-conteudo.svelte';
  import ListaEpisodios from '$componentes/detalhes/lista-episodios.svelte';
  import PainelTrailers from '$componentes/detalhes/painel-trailers.svelte';
  import CartaoConteudo from '$componentes/home/cartao-conteudo.svelte';

  export let data;

  const ABAS = [
    { chave: 'episodios', rotulo: 'Episódios' },
    { chave: 'sobre', rotulo: 'Sobre' },
    { chave: 'personagens', rotulo: 'Personagens' },
    { chave: 'recomendacoes', rotulo: 'Recomendações' }
  ];

  let aba = 'episodios';
</script>

<svelte:head>
  <title>{data.destaque.nome} — Yōkira Animes</title>
  <meta name="description" content={data.destaque.sinopse.slice(0, 155)} />
</svelte:head>

<div class="detalhes">
  <div class="detalhes-principal">
    <CabecalhoTitulo
      destaque={data.destaque}
      nota={data.nota}
      naLista={data.naLista}
      minhaNota={data.minhaNota}
    />

    <AbasConteudo abas={ABAS} ativa={aba} on:trocar={(evento) => (aba = evento.detail)} />

    {#if aba === 'episodios'}
      <ListaEpisodios temporadas={data.temporadas} />
    {:else if aba === 'sobre'}
      <p class="detalhes-sobre">{data.destaque.sinopse}</p>
      <p class="detalhes-sobre-meta">
        {data.destaque.ano} · {data.destaque.temporadas} temporadas · {data.destaque.generos.join(
          ', '
        )}
      </p>
    {:else if aba === 'personagens'}
      <p class="detalhes-sobre">
        A ficha de personagens deste título ainda não foi cadastrada no painel administrativo.
      </p>
    {:else}
      <ul class="grade-titulos detalhes-recomendacoes">
        {#each data.recomendacoes as item (item.id)}
          <CartaoConteudo {item} />
        {/each}
      </ul>
    {/if}
  </div>

  <PainelTrailers
    slug={data.destaque.slug}
    arteDoTrailer={data.destaque.arte}
    nomeDoTrailer={`Trailer Oficial da Temporada ${data.destaque.temporadas}`}
    duracaoDoTrailer="1:30"
    maisEpisodios={data.maisEpisodios}
  />
</div>
