<!-- Arquivo: src/lib/visual/icones/seta-direita.svelte -->
<!-- Seta do carrossel e do "Ver mais". Herda a cor do contexto pra servir em qualquer superficie. -->
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
  <path d="M9.4 5.2 16.2 12l-6.8 6.8" />
</svg>
