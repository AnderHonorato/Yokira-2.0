<!-- Arquivo: src/lib/componentes/detalhes/cabecalho-titulo.svelte -->
<!-- Banner deitado no topo e o texto entrando por baixo, dentro do degrade. A arte
     era um retrato de 118px em pe ao lado do texto — vertical ate no celular, onde
     banner e justamente o formato que cabe. O degrade e o que costura os dois: sem
     ele a imagem termina numa borda dura e o bloco vira duas pecas soltas. -->
<script lang="ts">
  import './cabecalho-titulo.css';
  import BotaoPill from '../comum/botao-pill.svelte';
  import Chip from '../comum/chip.svelte';
  import Coroa from '$visual/icones/coroa.svelte';
  import Play from '$visual/icones/play.svelte';
  import Mais from '$visual/icones/mais.svelte';
  import Estrela from '$visual/icones/estrela.svelte';
  import PolegarCima from '$visual/icones/polegar-cima.svelte';
  import Verificado from '$visual/icones/verificado.svelte';
  import Girador from '../comum/girador.svelte';
  import { alternarLista, avaliar } from '$cliente/acoes-do-usuario';
  import { avisar, avisarErro } from '$cliente/avisos';
  import type { DestaqueDoHero } from '$servidor/banco/tipos-catalogo';

  export let destaque: DestaqueDoHero;
  export let nota: number | null = null;
  export let naLista = false;
  export let minhaNota: number | null = null;

  const NOTA_DE_CURTIDA = 10;

  let salvando = false;
  let curtindo = false;

  $: curtido = minhaNota === NOTA_DE_CURTIDA;

  async function aoAlternar() {
    salvando = true;
    // Estado otimista: a interface responde antes do servidor e volta atras se der erro.
    const anterior = naLista;
    naLista = !naLista;
    try {
      const resultado = await alternarLista(destaque.id);
      naLista = resultado.naLista;
      avisar(
        naLista ? `${destaque.nome} entrou na sua lista.` : `${destaque.nome} saiu da sua lista.`,
        naLista ? 'sucesso' : 'neutro'
      );
    } catch (erro) {
      naLista = anterior;
      avisarErro(erro, 'Não foi possível salvar na sua lista.');
    } finally {
      salvando = false;
    }
  }

  async function aoCurtir() {
    curtindo = true;
    const anterior = minhaNota;
    minhaNota = curtido ? null : NOTA_DE_CURTIDA;
    try {
      const resultado = await avaliar(destaque.id, minhaNota);
      // A media volta do servidor: curtir mexe na nota que a propria tela mostra.
      nota = resultado.media;
      avisar(
        anterior === NOTA_DE_CURTIDA ? 'Curtida removida.' : 'Você curtiu este título.',
        anterior === NOTA_DE_CURTIDA ? 'neutro' : 'sucesso'
      );
    } catch (erro) {
      minhaNota = anterior;
      avisarErro(erro, 'Não foi possível registrar sua curtida.');
    } finally {
      curtindo = false;
    }
  }
</script>

<section class="titulo-hero">
  <img
    class="titulo-hero-arte"
    src={destaque.arte}
    alt={`Arte de ${destaque.nome}`}
    fetchpriority="high"
    decoding="async"
  />
  <div class="titulo-hero-veu" aria-hidden="true"></div>

  {#if destaque.novidade}
    <span class="titulo-hero-selo">Novo episódio</span>
  {/if}

  <div class="titulo-hero-texto">
    <h1 class="titulo-hero-nome">{destaque.nome}</h1>

    <p class="titulo-hero-gratuito">
      <span class="titulo-hero-coroa"><Coroa tamanho={16} /></span>
      {destaque.chamadaGratuita}
    </p>

    <p class="titulo-hero-meta">
      <Chip variante="classificacao">{destaque.classificacao}</Chip>
      <span>{destaque.ano}</span>
      <span aria-hidden="true">•</span>
      {#if destaque.ehFilme}
        <span>Filme</span>
      {:else}
        <span>{destaque.temporadas} {destaque.temporadas === 1 ? 'Temporada' : 'Temporadas'}</span>
      {/if}
      <span aria-hidden="true">•</span>
      <span>{destaque.generos.join(', ')}</span>
      {#if nota !== null}
        <span class="titulo-hero-nota"><Estrela tamanho={12} /> {nota.toFixed(1)}</span>
      {/if}
    </p>

    <p class="titulo-hero-sinopse">{destaque.sinopse}</p>

    <div class="titulo-hero-acoes">
      <BotaoPill variante="marca" href={`/titulo/${destaque.slug}`}>
        <Play tamanho={15} /> Assistir agora
      </BotaoPill>

      <BotaoPill
        variante={naLista ? 'sucesso' : 'neutro'}
        ativo={naLista}
        desabilitado={salvando}
        on:click={aoAlternar}
      >
        {#if salvando}
          <Girador />
        {:else if naLista}
          <Verificado tamanho={16} />
        {:else}
          <Mais tamanho={15} />
        {/if}
        {naLista ? 'Na Minha Lista' : 'Minha Lista'}
      </BotaoPill>

      <span class="titulo-hero-curtir" class:pill-curtido={curtido}>
        <BotaoPill
          variante="circular"
          ativo={curtido}
          desabilitado={curtindo}
          rotuloAcessivel={curtido ? 'Remover curtida' : 'Curtir este título'}
          on:click={aoCurtir}
        >
          {#if curtindo}<Girador />{:else}<PolegarCima tamanho={16} />{/if}
        </BotaoPill>
      </span>
    </div>
  </div>
</section>
