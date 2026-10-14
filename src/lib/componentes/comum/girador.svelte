<!-- Arquivo: src/lib/componentes/comum/girador.svelte -->
<!-- Spinner proprio em SVG (nada de biblioteca de icones). -->
<script lang="ts">
  import './girador.css';

  export let tamanho = 18;
</script>

<svg
  class="girador"
  width={tamanho}
  height={tamanho}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2.25"
  stroke-linecap="round"
  aria-hidden="true"
>
  <circle cx="12" cy="12" r="8.5" opacity="0.22" />
  <path d="M20.5 12a8.5 8.5 0 0 0-8.5-8.5" />
</svg>
