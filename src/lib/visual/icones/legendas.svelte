<!-- Arquivo: src/lib/visual/icones/legendas.svelte -->
<!-- Chip Legendas Br e botao de legenda do player. Herda a cor do contexto pra servir em qualquer superficie. -->
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
  <rect x="3" y="5.4" width="18" height="13.2" rx="2.4" /><path
    d="M10 10.4a2.6 2.6 0 1 0 0 3.2"
  /><path d="M16.6 10.4a2.6 2.6 0 1 0 0 3.2" />
</svg>
