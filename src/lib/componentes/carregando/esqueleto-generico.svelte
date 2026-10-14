<!-- Arquivo: src/lib/componentes/carregando/esqueleto-generico.svelte -->
<!-- Rotas de texto e formulario (entrar, cadastrar, configuracoes). Titulo e linhas. -->
<script lang="ts">
  import './esqueleto-generico.css';
  import Esqueleto from '../comum/esqueleto.svelte';
  import { repetir } from './esqueleto-de-rota';
</script>

<div class="esqueleto-generico">
  <div class="esqueleto-generico-titulo"><Esqueleto raio="var(--raio-chip)" /></div>
  {#each repetir(5) as indice (indice)}
    <div class="esqueleto-generico-linha"><Esqueleto raio="var(--raio-chip)" /></div>
  {/each}
</div>
