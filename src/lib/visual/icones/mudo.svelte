<!-- Arquivo: src/lib/visual/icones/mudo.svelte -->
<!-- Player sem som. Herda a cor do contexto pra servir em qualquer superficie. -->
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
  <path d="M4.6 9.4h3.2L12.4 5.4v13.2L7.8 14.6H4.6z" /><path
    d="m16.2 9.6 4.4 4.8M20.6 9.6l-4.4 4.8"
  />
</svg>
