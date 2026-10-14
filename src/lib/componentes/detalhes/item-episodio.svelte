<!-- Arquivo: src/lib/componentes/detalhes/item-episodio.svelte -->
<!-- Linha da lista: miniatura, "1. Nome do episodio", duracao, chips e download a direita. -->
<script lang="ts">
  import './item-episodio.css';
  import Chip from '../comum/chip.svelte';
  import Play from '$visual/icones/play.svelte';
  import Download from '$visual/icones/download.svelte';

  export let episodio: {
    id: string;
    numero: number;
    nome: string;
    duracaoMinutos: number;
    miniatura: string;
  };
  export let selecionado = false;
</script>

<li class="episodio" class:episodio-selecionado={selecionado}>
  <a class="episodio-link" href={`/assistir/${episodio.id}`}>
    <span class="episodio-miniatura">
      <img src={episodio.miniatura} alt="" aria-hidden="true" loading="lazy" decoding="async" />
      <span class="episodio-play"><Play tamanho={14} /></span>
    </span>

    <span class="episodio-corpo">
      <span class="episodio-nome">{episodio.numero}. {episodio.nome}</span>
      <span class="episodio-duracao">{episodio.duracaoMinutos}min</span>
      <span class="episodio-chips">
        <Chip>Legendas Br</Chip>
        <Chip variante="neutro">PT</Chip>
      </span>
    </span>
  </a>

  <button class="episodio-baixar" type="button" aria-label={`Baixar episódio ${episodio.numero}`}>
    <Download tamanho={18} />
  </button>
</li>
