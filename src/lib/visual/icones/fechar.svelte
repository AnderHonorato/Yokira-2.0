<!-- Arquivo: src/lib/visual/icones/fechar.svelte -->
<!-- Fechar dialogos e paineis. Herda a cor do contexto pra servir em qualquer superficie. -->
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
  <path d="M5.6 5.6 18.4 18.4M18.4 5.6 5.6 18.4" />
</svg>
