<!-- Arquivo: src/lib/visual/icones/polegar-cima.svelte -->
<!-- Curtir. Botao circular ao lado do hero. Herda a cor do contexto pra servir em qualquer superficie. -->
<script lang="ts">
  export let tamanho: number = 20;
  export let preenchida: boolean = false;
</script>

<svg
  width={tamanho}
  height={tamanho}
  viewBox="0 0 24 24"
  fill={preenchida ? 'currentColor' : 'none'}
  stroke="currentColor"
  stroke-width="1.75"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
>
  <path d="M7.4 10.6h-2a1.4 1.4 0 0 0-1.4 1.4v6.6a1.4 1.4 0 0 0 1.4 1.4h2z" /><path
    d="M7.4 10.6 11.6 4a2 2 0 0 1 2 2v3.4h4.7a1.8 1.8 0 0 1 1.8 2.2l-1.2 5.8a1.8 1.8 0 0 1-1.8 1.4H7.4z"
  />
</svg>
