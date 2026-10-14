<!-- Arquivo: src/lib/visual/icones/pausa.svelte -->
<!-- Player. Herda a cor do contexto pra servir em qualquer superficie. -->
<script lang="ts">
  export let tamanho: number = 20;
</script>

<svg
  width={tamanho}
  height={tamanho}
  viewBox="0 0 24 24"
  fill="currentColor"
  stroke="currentColor"
  stroke-width="1.75"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
>
  <rect x="7" y="4.4" width="3.6" height="15.2" rx="1.2" /><rect
    x="13.4"
    y="4.4"
    width="3.6"
    height="15.2"
    rx="1.2"
  />
</svg>
