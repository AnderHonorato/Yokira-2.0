<!-- Arquivo: src/lib/componentes/detalhes/lista-episodios.svelte -->
<!-- Seletor "Temporada N" a esquerda, "Ordenar" a direita e a lista embaixo (imagem 3). -->
<script lang="ts">
  import './lista-episodios.css';
  import ItemEpisodio from './item-episodio.svelte';
  import SetaBaixo from '$visual/icones/seta-baixo.svelte';
  import { ordenarEpisodios, type Ordem } from './ordenar-episodios';

  export let temporadas: {
    id: string;
    numero: number;
    nome: string;
    episodios: {
      id: string;
      numero: number;
      nome: string;
      duracaoMinutos: number;
      miniatura: string;
    }[];
  }[];

  let temporadaId = temporadas.at(-1)?.id ?? '';
  let ordem: Ordem = 'crescente';

  $: temporada = temporadas.find((item) => item.id === temporadaId) ?? temporadas.at(-1);
  $: episodios = ordenarEpisodios(temporada?.episodios ?? [], ordem);
</script>

<div class="lista-episodios">
  <div class="lista-episodios-controles">
    <label class="seletor">
      <span class="apenas-leitor-de-tela">Temporada</span>
      <select bind:value={temporadaId}>
        {#each temporadas as item (item.id)}
          <option value={item.id}>Temporada {item.numero}</option>
        {/each}
      </select>
      <SetaBaixo tamanho={14} />
    </label>

    <label class="seletor">
      <span class="apenas-leitor-de-tela">Ordenar episódios</span>
      <select bind:value={ordem}>
        <option value="crescente">Ordenar</option>
        <option value="decrescente">Mais recentes</option>
      </select>
      <SetaBaixo tamanho={14} />
    </label>
  </div>

  <ul class="lista-episodios-itens">
    {#each episodios as episodio, indice (episodio.id)}
      <ItemEpisodio {episodio} selecionado={indice === 0} />
    {/each}
  </ul>
</div>
