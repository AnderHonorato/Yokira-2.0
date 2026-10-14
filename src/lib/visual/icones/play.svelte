<!-- Arquivo: src/lib/visual/icones/play.svelte -->
<!-- Botao Assistir agora e play dos episodios. Herda a cor do contexto pra servir em qualquer superficie. -->
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
  <path d="M7.4 4.6 19.2 12 7.4 19.4z" />
</svg>
