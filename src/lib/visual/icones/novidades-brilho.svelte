<!-- Arquivo: src/lib/visual/icones/novidades-brilho.svelte -->
<!-- Aba Novidades. Brilho de quatro pontas com duas faiscas menores. Herda a cor do contexto pra servir em qualquer superficie. -->
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
  <path d="M13 3.2 14.7 8 19.5 9.7 14.7 11.4 13 16.2 11.3 11.4 6.5 9.7 11.3 8z" /><path
    d="M18.6 15.4l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z"
  /><path d="M5.4 3.2l.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4L3.5 5.1l1.4-.5z" />
</svg>
