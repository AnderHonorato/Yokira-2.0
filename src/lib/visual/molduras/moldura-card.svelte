<!-- Arquivo: src/lib/visual/molduras/moldura-card.svelte -->
<!-- Recorte 2:3 usado por todo card de poster. Fica aqui pra proporcao nunca divergir entre trilhas. -->
<script lang="ts">
  import './moldura-card.css';

  export let fonte: string;
  export let descricao: string;
  export let carregamento: 'lazy' | 'eager' = 'lazy';
</script>

<div class="moldura-card">
  <img
    class="moldura-card-imagem"
    src={fonte}
    alt={descricao}
    loading={carregamento}
    decoding="async"
  />
  <slot />
</div>
