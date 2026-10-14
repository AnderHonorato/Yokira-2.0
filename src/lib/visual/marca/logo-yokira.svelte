<!-- Arquivo: src/lib/visual/marca/logo-yokira.svelte -->
<!-- Logo em texto (nao em imagem) pra ficar nitida em qualquer densidade e herdar o tema. -->
<!-- O CSS vem do arquivo ao lado; por isso as classes tem prefixo proprio e nao colidem. -->
<script lang="ts">
  import './logo-yokira.css';

  export let compacta: boolean = false;
</script>

<span class="marca-logo" class:marca-compacta={compacta}>
  <span class="marca-titulo">Y<span>Ō</span>K<span class="marca-destaque">IRA</span></span>
  {#if !compacta}
    <span class="marca-subtitulo">A N I M E E S</span>
  {/if}
</span>
