<!-- Arquivo: src/lib/visual/icones/excluir.svelte -->
<!-- Excluir — sempre atras da dupla confirmacao. Herda a cor do contexto pra servir em qualquer superficie. -->
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
  <path d="M4.6 6.6h14.8" /><path
    d="M9.2 6.6V4.8a1.2 1.2 0 0 1 1.2-1.2h3.2a1.2 1.2 0 0 1 1.2 1.2v1.8"
  /><path d="M6.6 6.6 7.5 19a1.4 1.4 0 0 0 1.4 1.3h6.2A1.4 1.4 0 0 0 16.5 19l.9-12.4" /><path
    d="M10.4 10.4v6M13.6 10.4v6"
  />
</svg>
