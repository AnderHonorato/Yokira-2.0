<!-- Arquivo: src/lib/componentes/home/cartao-expandido.svelte -->
<!-- Painel que aparece sobre o card no hover do desktop. So transform/opacity: precisa
     rodar na GPU pra nao travar o scroll da trilha. -->
<script lang="ts">
  import './cartao-expandido.css';
  import Estrela from '$visual/icones/estrela.svelte';
  import OlhoAssistindo from '$visual/icones/olho-assistindo.svelte';
  import type { CartaoDeTitulo } from '$servidor/banco/tipos-catalogo';

  export let item: CartaoDeTitulo;
</script>

<div class="expandido" role="presentation">
  <img class="expandido-arte" src={item.poster} alt="" aria-hidden="true" />

  <div class="expandido-corpo">
    <h4 class="expandido-titulo">{item.nome}</h4>
    <p class="expandido-sinopse">{item.sinopseCurta}</p>

    <p class="expandido-meta">
      {#if item.nota !== null}
        <span class="expandido-nota"><Estrela tamanho={12} /> {item.nota.toFixed(1)}</span>
      {/if}
      <span>{item.ano}</span>
      <span>{item.temporadas} {item.temporadas === 1 ? 'Temporada' : 'Temporadas'}</span>
    </p>

    <p class="expandido-audiencia">
      <span class="expandido-ponto" aria-hidden="true"></span>
      <OlhoAssistindo tamanho={13} />
      {item.assistindoAgora} assistindo agora
    </p>
  </div>
</div>
