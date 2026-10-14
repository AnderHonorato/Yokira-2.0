<!-- Arquivo: src/lib/componentes/home/cartao-conteudo.svelte -->
<!-- Card das trilhas: poster 2:3, titulo em 13px e a linha meta (ano · nota · Legendas Br). -->
<!-- No desktop o hover expande depois de 350ms; no mobile o toque abre o titulo direto. -->
<script lang="ts">
  import './cartao-conteudo.css';
  import MolduraCard from '$visual/molduras/moldura-card.svelte';
  import Estrela from '$visual/icones/estrela.svelte';
  import Chip from '../comum/chip.svelte';
  import CartaoExpandido from './cartao-expandido.svelte';
  import { criarControleDeExpansao } from './expansao-no-hover';
  import type { CartaoDeTitulo } from '$servidor/banco/tipos-catalogo';

  export let item: CartaoDeTitulo;
  export let carregamento: 'lazy' | 'eager' = 'lazy';

  const expansao = criarControleDeExpansao();
  const { expandido } = expansao;
</script>

<li class="cartao" data-item-carrossel>
  <a
    class="cartao-link"
    href={`/titulo/${item.slug}`}
    on:mouseenter={expansao.aoEntrar}
    on:mouseleave={expansao.aoSair}
    on:focusin={expansao.aoEntrar}
    on:focusout={expansao.aoSair}
  >
    <MolduraCard fonte={item.poster} descricao={`Pôster de ${item.nome}`} {carregamento}>
      {#if item.novidade}
        <span class="cartao-selo">Novo episódio</span>
      {/if}
    </MolduraCard>

    <h3 class="cartao-titulo">{item.nome}</h3>

    <p class="cartao-meta">
      {#if item.novidade}
        <!-- Nas Novidades a referencia mostra so a temporada, sem ano nem nota. -->
        <span>{item.rotuloSecundario}</span>
      {:else}
        <span>{item.ano}</span>
        {#if item.nota !== null}
          <span class="cartao-nota"><Estrela tamanho={12} /> {item.nota.toFixed(1)}</span>
        {/if}
        <Chip>{item.rotuloSecundario}</Chip>
      {/if}
    </p>

    {#if $expandido}
      <CartaoExpandido {item} />
    {/if}
  </a>
</li>
