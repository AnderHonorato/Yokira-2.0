<!-- Arquivo: src/lib/componentes/home/trilha-conteudo.svelte -->
<!-- Bloco "Populares / Em alta / Novidades": titulo a esquerda, "Ver mais >" a direita. -->
<script lang="ts">
  import './trilha-conteudo.css';
  import Carrossel from './carrossel.svelte';
  import CartaoConteudo from './cartao-conteudo.svelte';
  import SetaDireita from '$visual/icones/seta-direita.svelte';
  import type { TrilhaDeConteudo } from '$servidor/banco/tipos-catalogo';

  export let trilha: TrilhaDeConteudo;
  export let prioritaria = false;
</script>

<section class="trilha" aria-labelledby={`trilha-${trilha.chave}`}>
  <div class="trilha-topo">
    <h2 class="trilha-titulo" id={`trilha-${trilha.chave}`}>{trilha.titulo}</h2>
    <a class="trilha-ver-mais" href={trilha.verMaisUrl}>
      Ver mais <SetaDireita tamanho={14} />
    </a>
  </div>

  <Carrossel rotulo={trilha.titulo}>
    {#each trilha.itens as item, indice (item.id)}
      <CartaoConteudo {item} carregamento={prioritaria && indice < 5 ? 'eager' : 'lazy'} />
    {/each}
  </Carrossel>
</section>
