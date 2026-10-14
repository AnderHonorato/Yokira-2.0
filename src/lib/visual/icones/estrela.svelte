<!-- Arquivo: src/lib/visual/icones/estrela.svelte -->
<!-- Estrela da nota do card. Herda a cor do contexto pra servir em qualquer superficie. -->
<script lang="ts">
  export let tamanho: number = 12;
  export let preenchida: boolean = true;
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
  <path d="M12 3.6 14.6 8.9l5.9.85-4.25 4.15 1 5.85L12 17l-5.25 2.75 1-5.85L3.5 9.75l5.9-.85z" />
</svg>
