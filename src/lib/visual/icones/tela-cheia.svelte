<!-- Arquivo: src/lib/visual/icones/tela-cheia.svelte -->
<!-- Player em tela cheia. Herda a cor do contexto pra servir em qualquer superficie. -->
<script lang="ts">
  export let tamanho: number = 20;
</script>

<svg
  width={tamanho}
  height={tamanho}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.75"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
>
  <path d="M4.4 9V5.6a1.2 1.2 0 0 1 1.2-1.2H9" /><path
    d="M15 4.4h3.4a1.2 1.2 0 0 1 1.2 1.2V9"
  /><path d="M19.6 15v3.4a1.2 1.2 0 0 1-1.2 1.2H15" /><path
    d="M9 19.6H5.6a1.2 1.2 0 0 1-1.2-1.2V15"
  />
</svg>
