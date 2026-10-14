<!-- Arquivo: src/lib/componentes/carregando/esqueleto-detalhes.svelte -->
<!-- Pagina de titulo: banner deitado, acoes numa linha so, abas e lista de episodios. -->
<script lang="ts">
  import './esqueleto-detalhes.css';
  import Esqueleto from '../comum/esqueleto.svelte';
  import { repetir } from './esqueleto-de-rota';
</script>

<div class="esqueleto-detalhes">
  <div class="esqueleto-detalhes-principal">
    <div class="esqueleto-detalhes-banner"><Esqueleto raio="var(--raio-painel)" /></div>

    <div class="esqueleto-detalhes-nome"><Esqueleto raio="var(--raio-chip)" /></div>
    <div class="esqueleto-detalhes-meta"><Esqueleto raio="var(--raio-chip)" /></div>

    <!-- Numa linha so, de proposito: e assim que a pagina de verdade se comporta. -->
    <div class="esqueleto-detalhes-acoes">
      {#each repetir(4) as indice (indice)}
        <div class="esqueleto-detalhes-acao"><Esqueleto raio="var(--raio-botao)" /></div>
      {/each}
    </div>

    <div class="esqueleto-detalhes-abas">
      {#each repetir(4) as indice (indice)}
        <div class="esqueleto-detalhes-aba"><Esqueleto raio="var(--raio-chip)" /></div>
      {/each}
    </div>

    <ul class="esqueleto-detalhes-episodios">
      {#each repetir(6) as indice (indice)}
        <li class="esqueleto-episodio">
          <div class="esqueleto-episodio-miniatura"><Esqueleto /></div>
          <div class="esqueleto-episodio-texto">
            <div class="esqueleto-episodio-nome"><Esqueleto raio="var(--raio-chip)" /></div>
            <div class="esqueleto-episodio-linha"><Esqueleto raio="var(--raio-chip)" /></div>
          </div>
        </li>
      {/each}
    </ul>
  </div>

  <aside class="esqueleto-detalhes-painel">
    <div class="esqueleto-detalhes-trailer"><Esqueleto raio="var(--raio-card)" /></div>
    {#each repetir(3) as indice (indice)}
      <div class="esqueleto-detalhes-lateral"><Esqueleto raio="var(--raio-card)" /></div>
    {/each}
  </aside>
</div>
