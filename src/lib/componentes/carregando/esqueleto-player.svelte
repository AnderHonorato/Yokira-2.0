<!-- Arquivo: src/lib/componentes/carregando/esqueleto-player.svelte -->
<!-- Tela de assistir: o quadro do video e a ficha do episodio embaixo. -->
<script lang="ts">
  import './esqueleto-player.css';
  import Esqueleto from '../comum/esqueleto.svelte';
  import { repetir } from './esqueleto-de-rota';
</script>

<div class="esqueleto-player">
  <div class="esqueleto-player-quadro"><Esqueleto raio="var(--raio-painel)" /></div>
  <div class="esqueleto-player-nome"><Esqueleto raio="var(--raio-chip)" /></div>
  <div class="esqueleto-player-meta"><Esqueleto raio="var(--raio-chip)" /></div>

  <div class="esqueleto-player-acoes">
    {#each repetir(3) as indice (indice)}
      <div class="esqueleto-player-acao"><Esqueleto raio="var(--raio-botao)" /></div>
    {/each}
  </div>
</div>
