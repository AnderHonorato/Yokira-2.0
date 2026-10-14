<!-- Arquivo: src/lib/visual/icones/menu.svelte -->
<!-- Menu compacto em telas estreitas. Herda a cor do contexto pra servir em qualquer superficie. -->
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
  <path d="M4 6.8h16M4 12h16M4 17.2h16" />
</svg>
