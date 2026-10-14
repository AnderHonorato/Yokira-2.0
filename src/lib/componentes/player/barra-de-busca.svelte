<!-- Arquivo: src/lib/componentes/player/barra-de-busca.svelte -->
<!-- Barra de progresso do video. Arrastar com o dedo tambem precisa funcionar, entao
     usa pointer events e captura o ponteiro: sem a captura, tirar o dedo de cima da
     barra no meio do arrasto largava o seek na metade do caminho. -->
<script lang="ts">
  import './barra-de-busca.css';
  import { createEventDispatcher } from 'svelte';
  import { formatarTempo, fracaoAssistida, segundoNaPosicao } from './formatar-tempo';

  export let atual = 0;
  export let duracao = 0;
  export let carregado = 0;

  const despachar = createEventDispatcher<{ buscar: number }>();

  let trilho: HTMLDivElement;
  let arrastando = false;

  $: fracao = fracaoAssistida(atual, duracao);
  $: fracaoCarregada = fracaoAssistida(carregado, duracao);

  function posicaoDoEvento(evento: PointerEvent): number {
    const caixa = trilho.getBoundingClientRect();
    if (caixa.width === 0) return 0;
    return Math.min(1, Math.max(0, (evento.clientX - caixa.left) / caixa.width));
  }

  function aoPressionar(evento: PointerEvent) {
    arrastando = true;
    trilho.setPointerCapture(evento.pointerId);
    despachar('buscar', segundoNaPosicao(posicaoDoEvento(evento), duracao));
  }

  function aoMover(evento: PointerEvent) {
    if (!arrastando) return;
    despachar('buscar', segundoNaPosicao(posicaoDoEvento(evento), duracao));
  }

  function aoSoltar(evento: PointerEvent) {
    if (!arrastando) return;
    arrastando = false;
    trilho.releasePointerCapture(evento.pointerId);
  }
</script>

<div
  class="busca"
  class:busca-arrastando={arrastando}
  bind:this={trilho}
  role="slider"
  tabindex="0"
  aria-label="Posição do vídeo"
  aria-valuemin={0}
  aria-valuemax={Math.round(duracao) || 0}
  aria-valuenow={Math.round(atual)}
  aria-valuetext={`${formatarTempo(atual)} de ${formatarTempo(duracao)}`}
  on:pointerdown={aoPressionar}
  on:pointermove={aoMover}
  on:pointerup={aoSoltar}
  on:pointercancel={aoSoltar}
>
  <div class="busca-trilho">
    <div class="busca-carregado" style:width={`${fracaoCarregada * 100}%`}></div>
    <div class="busca-assistido" style:width={`${fracao * 100}%`}></div>
  </div>
  <span class="busca-marcador" style:left={`${fracao * 100}%`}></span>
</div>
