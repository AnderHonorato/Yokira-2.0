<!-- Arquivo: src/lib/componentes/carregando/esqueleto-cartao.svelte -->
<!-- Placeholder de um card de titulo. Repete as larguras de cartao-conteudo.css e a
     proporcao de moldura-card.css: se divergir, a grade pula quando o dado chega. -->
<script lang="ts">
  import './esqueleto-cartao.css';
  import Esqueleto from '../comum/esqueleto.svelte';
</script>

<li class="esqueleto-cartao">
  <div class="esqueleto-cartao-capa"><Esqueleto /></div>
  <div class="esqueleto-cartao-nome"><Esqueleto raio="var(--raio-chip)" /></div>
  <div class="esqueleto-cartao-meta"><Esqueleto raio="var(--raio-chip)" /></div>
</li>
