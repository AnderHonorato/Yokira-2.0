<!-- Arquivo: src/lib/componentes/comum/esqueleto.svelte -->
<!-- Placeholder com brilho. Existe pra tela nunca ficar branca esperando dado. -->
<script lang="ts">
  import './esqueleto.css';

  export let altura = '100%';
  export let largura = '100%';
  export let raio = 'var(--raio-card)';
</script>

<div
  class="esqueleto"
  style:height={altura}
  style:width={largura}
  style:border-radius={raio}
  aria-hidden="true"
></div>
