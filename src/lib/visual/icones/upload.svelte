<!-- Arquivo: src/lib/visual/icones/upload.svelte -->
<!-- Envio de arquivos no painel administrativo. Herda a cor do contexto pra servir em qualquer superficie. -->
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
  <path d="M12 20.2V9.4" /><path d="m7.4 13.8 4.6-4.4 4.6 4.4" /><path
    d="M4.4 6.2v-.6a1.4 1.4 0 0 1 1.4-1.4h12.4a1.4 1.4 0 0 1 1.4 1.4v.6"
  />
</svg>
