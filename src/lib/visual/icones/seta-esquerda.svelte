<!-- Arquivo: src/lib/visual/icones/seta-esquerda.svelte -->
<!-- Seta do carrossel e do voltar. Herda a cor do contexto pra servir em qualquer superficie. -->
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
  <path d="M14.6 5.2 7.8 12l6.8 6.8" />
</svg>
