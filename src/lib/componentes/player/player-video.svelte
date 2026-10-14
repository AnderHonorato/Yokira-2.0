<!-- Arquivo: src/lib/componentes/player/player-video.svelte -->
<!-- Player HLS com controles proprios. Os nativos davam tela cheia e acessibilidade de
     graca, mas cada navegador desenhava um player diferente e nenhum deles enxergava as
     variantes de qualidade que o nosso HLS publica. -->
<script lang="ts">
  import './player-video.css';
  import { onDestroy, onMount } from 'svelte';
  import { anexarPlaylist, type MidiaAnexada, type NivelDeQualidade } from './carregar-hls';
  import { pedirPlaylist } from './pedir-playlist';
  import { criarAgendador } from './progresso-periodico';
  import { criarOcultador } from './ocultar-controles';
  import { criarPulso } from './pulso-de-audiencia';
  import { MIDIA_PARADA, observarMidia, type EstadoDaMidia } from './estado-da-midia';
  import { acaoDaTecla, aplicarAtalho } from './atalhos-do-player';
  import { obterChaveDeAudiencia } from './chave-de-audiencia';
  import ControlesPlayer from './controles-player.svelte';
  import { salvarProgressoNoServidor, sinalizarAudiencia } from '$cliente/acoes-do-usuario';
  import OlhoAssistindo from '$visual/icones/olho-assistindo.svelte';

  export let episodioId: string;
  export let temMidia = false;
  export let segundoInicial = 0;

  let quadro: HTMLDivElement;
  let video: HTMLVideoElement;
  let assistindo = 0;
  let mensagemErro: string | null = null;
  let midia: MidiaAnexada | undefined;
  let pararDeObservar: (() => void) | undefined;

  let estado: EstadoDaMidia = MIDIA_PARADA;
  let niveis: NivelDeQualidade[] = [];
  let nivelAtual = -1;
  let controlesVisiveis = true;

  const ocultador = criarOcultador((visivel) => (controlesVisiveis = visivel));
  const agendador = criarAgendador((segundos) => {
    void salvarProgressoNoServidor(episodioId, segundos).catch(() => undefined);
  });
  const pulso = criarPulso(
    async () => (await sinalizarAudiencia(episodioId, obterChaveDeAudiencia())).assistindo,
    (contagem) => (assistindo = contagem)
  );

  function alternar() {
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
  }

  function buscar(segundos: number) {
    video.currentTime = segundos;
  }

  function alternarTelaCheia() {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void quadro.requestFullscreen().catch(() => undefined);
  }

  function definirVolume(valor: number) {
    video.volume = valor;
    video.muted = valor === 0;
  }

  const comandos = {
    alternar,
    buscar,
    alternarMudo: () => (video.muted = !video.muted),
    alternarTelaCheia,
    definirVolume,
    tempoAtual: () => estado.atual,
    duracao: () => estado.duracao,
    volumeAtual: () => estado.volume
  };

  function aoTeclar(evento: KeyboardEvent) {
    const acao = acaoDaTecla(evento.key, evento.target);
    if (!acao) return;
    evento.preventDefault();
    ocultador.revelar();
    aplicarAtalho(acao, comandos);
  }

  /** Pausado a barra fica; tocando ela some sozinha. */
  function aoMudarMidia(novo: EstadoDaMidia) {
    const parou = estado.tocando && !novo.tocando;
    estado = novo;
    agendador.aoAtualizarTempo(novo.atual);
    if (parou) agendador.gravarAgora(novo.atual);
    ocultador.travar(!novo.tocando);
  }

  // Uma gravacao final quando a aba fecha: o onDestroy nao roda em fechamento de aba.
  const aoSair = () => agendador.encerrar();

  onMount(() => {
    window.addEventListener('beforeunload', aoSair);

    void (async () => {
      if (temMidia) {
        pararDeObservar = observarMidia(video, aoMudarMidia);
        try {
          // A URL e assinada e curta: pedimos agora, nao na renderizacao da pagina.
          const { playlist } = await pedirPlaylist(episodioId);
          midia = await anexarPlaylist(video, playlist, (lista) => (niveis = lista));
          niveis = midia.niveis;
          if (segundoInicial > 0) video.currentTime = segundoInicial;
        } catch (erro) {
          mensagemErro =
            erro instanceof Error ? erro.message : 'Não foi possível carregar o vídeo.';
        }
      }
      pulso.iniciar();
    })();
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') window.removeEventListener('beforeunload', aoSair);
    pulso.encerrar();
    ocultador.encerrar();
    pararDeObservar?.();
    midia?.desanexar();
    agendador.encerrar();
  });
</script>

<div class="player">
  {#if temMidia}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="player-quadro"
      class:player-quadro-limpo={!controlesVisiveis}
      bind:this={quadro}
      role="region"
      aria-label="Reprodutor de vídeo"
      tabindex="-1"
      on:keydown={aoTeclar}
      on:pointermove={() => ocultador.revelar()}
    >
      <video
        class="player-video"
        bind:this={video}
        playsinline
        preload="metadata"
        on:click={alternar}
      >
        <track kind="captions" label="Sem legenda cadastrada" />
      </video>

      <ControlesPlayer
        {estado}
        {niveis}
        {nivelAtual}
        on:alternar={alternar}
        on:buscar={(evento) => buscar(evento.detail)}
        on:volume={(evento) => definirVolume(evento.detail)}
        on:mudo={() => (video.muted = !video.muted)}
        on:nivel={(evento) => {
          nivelAtual = evento.detail;
          midia?.definirNivel(evento.detail);
        }}
        on:telaCheia={alternarTelaCheia}
      />
    </div>

    {#if mensagemErro}
      <p class="player-erro" role="alert">{mensagemErro}</p>
    {/if}
  {:else}
    <div class="player-vazio">
      <p>Este episódio ainda não tem vídeo processado.</p>
      <p class="player-vazio-dica">Envie o arquivo pelo painel administrativo para gerar o HLS.</p>
    </div>
  {/if}

  <p class="player-audiencia">
    <span class="player-ponto" aria-hidden="true"></span>
    <OlhoAssistindo tamanho={14} />
    {assistindo} assistindo agora
  </p>
</div>
