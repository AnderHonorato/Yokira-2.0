<!-- Arquivo: src/lib/visual/icones/lupa.svelte -->
<!-- Busca do cabecalho. Herda a cor do contexto pra servir em qualquer superficie. -->
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
  <circle cx="10.8" cy="10.8" r="6.4" /><path d="m20 20-4.6-4.6" />
</svg>
