<!-- Arquivo: src/lib/visual/icones/marcador-lista.svelte -->
<!-- Aba Minha Lista. Marcador de pagina. Herda a cor do contexto pra servir em qualquer superficie. -->
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
  <path d="M6.4 3.8h11.2a1 1 0 0 1 1 1v15.1L12 16.4l-6.6 3.5V4.8a1 1 0 0 1 1-1z" />
</svg>
