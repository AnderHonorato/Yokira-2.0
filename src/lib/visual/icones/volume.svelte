<!-- Arquivo: src/lib/visual/icones/volume.svelte -->
<!-- Player com som ligado. Herda a cor do contexto pra servir em qualquer superficie. -->
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
  <path d="M4.6 9.4h3.2L12.4 5.4v13.2L7.8 14.6H4.6z" /><path d="M16 9a4.4 4.4 0 0 1 0 6" /><path
    d="M18.6 6.4a8 8 0 0 1 0 11.2"
  />
</svg>
