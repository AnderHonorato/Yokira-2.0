<!-- Arquivo: src/lib/componentes/carregando/esqueleto-grade.svelte -->
<!-- Catalogo, Novidades, Generos, Minha Lista e Busca: titulo, filtros e a grade. -->
<script lang="ts">
  import './esqueleto-grade.css';
  import Esqueleto from '../comum/esqueleto.svelte';
  import EsqueletoCartao from './esqueleto-cartao.svelte';
  import { repetir } from './esqueleto-de-rota';

  export let filtros = 6;
  export let cartoes = 12;
</script>

<div class="esqueleto-grade">
  <div class="esqueleto-grade-titulo"><Esqueleto raio="var(--raio-chip)" /></div>

  <div class="esqueleto-grade-filtros">
    {#each repetir(filtros) as indice (indice)}
      <div class="esqueleto-grade-filtro"><Esqueleto raio="var(--raio-botao)" /></div>
    {/each}
  </div>

  <ul class="esqueleto-grade-itens">
    {#each repetir(cartoes) as indice (indice)}
      <EsqueletoCartao />
    {/each}
  </ul>
</div>
