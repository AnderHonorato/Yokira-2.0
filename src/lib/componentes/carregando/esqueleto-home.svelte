<!-- Arquivo: src/lib/componentes/carregando/esqueleto-home.svelte -->
<!-- Home carregando: o hero 16:9 com o texto no degrade e tres trilhas embaixo. -->
<script lang="ts">
  import './esqueleto-home.css';
  import Esqueleto from '../comum/esqueleto.svelte';
  import EsqueletoTrilha from './esqueleto-trilha.svelte';
  import { repetir } from './esqueleto-de-rota';
</script>

<div class="esqueleto-home">
  <div class="esqueleto-hero">
    <div class="esqueleto-hero-arte"><Esqueleto raio="0" /></div>
    <div class="esqueleto-hero-texto">
      <div class="esqueleto-hero-nome"><Esqueleto raio="var(--raio-chip)" /></div>
      <div class="esqueleto-hero-linha"><Esqueleto raio="var(--raio-chip)" /></div>
      <div class="esqueleto-hero-linha esqueleto-hero-curta">
        <Esqueleto raio="var(--raio-chip)" />
      </div>
      <div class="esqueleto-hero-acoes">
        <div class="esqueleto-hero-botao"><Esqueleto raio="var(--raio-botao)" /></div>
        <div class="esqueleto-hero-botao"><Esqueleto raio="var(--raio-botao)" /></div>
      </div>
    </div>
  </div>

  {#each repetir(3) as indice (indice)}
    <EsqueletoTrilha />
  {/each}
</div>
