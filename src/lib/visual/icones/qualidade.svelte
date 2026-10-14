<!-- Arquivo: src/lib/visual/icones/qualidade.svelte -->
<!-- Selecao de qualidade do player. Herda a cor do contexto pra servir em qualquer superficie. -->
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
  <path d="M4.4 7.2h15.2M4.4 12h15.2M4.4 16.8h15.2" /><circle cx="9" cy="7.2" r="2" /><circle
    cx="15.4"
    cy="12"
    r="2"
  /><circle cx="8" cy="16.8" r="2" />
</svg>
