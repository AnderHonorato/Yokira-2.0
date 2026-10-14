<!-- Arquivo: src/lib/visual/icones/perfil.svelte -->
<!-- Avatar do cabecalho quando o usuario nao tem foto. Herda a cor do contexto pra servir em qualquer superficie. -->
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
  <circle cx="12" cy="8.2" r="3.7" /><path d="M4.8 20.2a7.2 7.2 0 0 1 14.4 0" />
</svg>
