<!-- Arquivo: src/lib/componentes/home/carrossel.svelte -->
<!-- Trilha rolavel. Mobile: arrasto com snap. Desktop: faixas de borda que acendem
     quando o cursor chega perto da esquerda ou da direita, e desabilitam nas pontas.
     Sem seta quando tudo ja cabe na tela. -->
<script lang="ts">
  import './carrossel.css';
  import { onMount } from 'svelte';
  import SetaEsquerda from '$visual/icones/seta-esquerda.svelte';
  import SetaDireita from '$visual/icones/seta-direita.svelte';
  import { deslocar, indiceVizinho, medirEstado } from './carrossel';

  export let rotulo: string;

  let trilha: HTMLElement;
  let podeVoltar = false;
  let podeAvancar = false;

  function medir() {
    if (!trilha) return;
    ({ podeVoltar, podeAvancar } = medirEstado(trilha));
  }

  function aoTeclar(evento: KeyboardEvent) {
    if (evento.key !== 'ArrowRight' && evento.key !== 'ArrowLeft') return;
    const focaveis = Array.from(trilha.querySelectorAll<HTMLElement>('[data-item-carrossel]'));
    const atual = focaveis.findIndex((item) => item.contains(document.activeElement));
    if (atual < 0) return;
    evento.preventDefault();
    focaveis[indiceVizinho(atual, evento.key === 'ArrowRight' ? 1 : -1, focaveis.length)]?.focus();
  }

  onMount(() => {
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(trilha);
    return () => observador.disconnect();
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="carrossel"
  role="group"
  aria-roledescription="carrossel"
  aria-label={rotulo}
  on:keydown={aoTeclar}
>
  <button
    class="carrossel-seta carrossel-seta-esquerda"
    type="button"
    aria-label={`Voltar em ${rotulo}`}
    disabled={!podeVoltar}
    on:click={() => deslocar(trilha, -1)}
  >
    <span class="carrossel-seta-disco"><SetaEsquerda tamanho={20} /></span>
  </button>

  <ul class="carrossel-trilha rolagem-oculta" bind:this={trilha} on:scroll={medir}>
    <slot />
  </ul>

  <button
    class="carrossel-seta carrossel-seta-direita"
    type="button"
    aria-label={`Avançar em ${rotulo}`}
    disabled={!podeAvancar}
    on:click={() => deslocar(trilha, 1)}
  >
    <span class="carrossel-seta-disco"><SetaDireita tamanho={20} /></span>
  </button>
</div>
