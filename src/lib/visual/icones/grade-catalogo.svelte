<!-- Arquivo: src/lib/visual/icones/grade-catalogo.svelte -->
<!-- Aba Catalogo. Grade de 4 blocos igual ao icone da barra inferior. Herda a cor do contexto pra servir em qualquer superficie. -->
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
  <rect x="3.6" y="3.6" width="7" height="7" rx="1.6" /><rect
    x="13.4"
    y="3.6"
    width="7"
    height="7"
    rx="1.6"
  /><rect x="3.6" y="13.4" width="7" height="7" rx="1.6" /><rect
    x="13.4"
    y="13.4"
    width="7"
    height="7"
    rx="1.6"
  />
</svg>
