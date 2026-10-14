<!-- Arquivo: src/lib/componentes/carregando/esqueleto-painel.svelte -->
<!-- Painel administrativo: titulo, atalhos, os numeros e as linhas da tabela. -->
<script lang="ts">
  import './esqueleto-painel.css';
  import Esqueleto from '../comum/esqueleto.svelte';
  import { repetir } from './esqueleto-de-rota';
</script>

<div class="esqueleto-painel">
  <div class="esqueleto-painel-titulo"><Esqueleto raio="var(--raio-chip)" /></div>
  <div class="esqueleto-painel-subtitulo"><Esqueleto raio="var(--raio-chip)" /></div>

  <div class="esqueleto-painel-atalhos">
    {#each repetir(4) as indice (indice)}
      <div class="esqueleto-painel-atalho"><Esqueleto raio="var(--raio-card)" /></div>
    {/each}
  </div>

  <div class="esqueleto-painel-numeros">
    {#each repetir(3) as indice (indice)}
      <div class="esqueleto-painel-numero"><Esqueleto raio="var(--raio-card)" /></div>
    {/each}
  </div>

  <ul class="esqueleto-painel-linhas">
    {#each repetir(6) as indice (indice)}
      <li class="esqueleto-painel-linha"><Esqueleto raio="var(--raio-chip)" /></li>
    {/each}
  </ul>
</div>
