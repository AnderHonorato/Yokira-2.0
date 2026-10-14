<!-- Arquivo: src/lib/componentes/player/controles-player.svelte -->
<!-- Barra de controles propria. Os controles nativos davam tela cheia e acessibilidade
     de graca, mas cada navegador desenhava um player diferente e nenhum deles conhecia
     as variantes de qualidade que o nosso HLS oferece. -->
<script lang="ts">
  import './controles-player.css';
  import { createEventDispatcher } from 'svelte';
  import BarraDeBusca from './barra-de-busca.svelte';
  import { formatarTempo } from './formatar-tempo';
  import type { NivelDeQualidade } from './carregar-hls';
  import type { EstadoDaMidia } from './estado-da-midia';
  import Play from '$visual/icones/play.svelte';
  import Pausa from '$visual/icones/pausa.svelte';
  import Volume from '$visual/icones/volume.svelte';
  import Mudo from '$visual/icones/mudo.svelte';
  import Qualidade from '$visual/icones/qualidade.svelte';
  import TelaCheia from '$visual/icones/tela-cheia.svelte';

  export let estado: EstadoDaMidia;
  export let niveis: NivelDeQualidade[] = [];
  export let nivelAtual = -1;

  const despachar = createEventDispatcher<{
    alternar: void;
    buscar: number;
    volume: number;
    mudo: void;
    nivel: number;
    telaCheia: void;
  }>();

  let menuAberto = false;

  $: rotuloDoNivel = niveis.find((nivel) => nivel.indice === nivelAtual)?.rotulo ?? 'Auto';
</script>

<div class="controles">
  <BarraDeBusca
    atual={estado.atual}
    duracao={estado.duracao}
    carregado={estado.carregado}
    on:buscar={(e) => despachar('buscar', e.detail)}
  />

  <div class="controles-linha">
    <button
      class="controles-botao"
      type="button"
      aria-label={estado.tocando ? 'Pausar' : 'Reproduzir'}
      on:click={() => despachar('alternar')}
    >
      {#if estado.tocando}<Pausa tamanho={20} />{:else}<Play tamanho={20} />{/if}
    </button>

    <div class="controles-volume">
      <button
        class="controles-botao"
        type="button"
        aria-label={estado.mudo || estado.volume === 0 ? 'Reativar som' : 'Silenciar'}
        on:click={() => despachar('mudo')}
      >
        {#if estado.mudo || estado.volume === 0}<Mudo tamanho={20} />{:else}<Volume
            tamanho={20}
          />{/if}
      </button>
      <input
        class="controles-volume-faixa"
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={estado.mudo ? 0 : estado.volume}
        aria-label="Volume"
        on:input={(evento) => despachar('volume', Number(evento.currentTarget.value))}
      />
    </div>

    <span class="controles-tempo">
      {formatarTempo(estado.atual)} <span class="controles-tempo-separador">/</span>
      {formatarTempo(estado.duracao)}
    </span>

    <span class="controles-espaco"></span>

    <!-- O seletor so aparece quando ha o que escolher: no HLS nativo a lista vem
         vazia porque o navegador nao a expoe, e um menu de um item so seria enfeite. -->
    {#if niveis.length > 1}
      <div class="controles-menu">
        <button
          class="controles-botao controles-botao-texto"
          type="button"
          aria-haspopup="true"
          aria-expanded={menuAberto}
          aria-label={`Qualidade: ${rotuloDoNivel}`}
          on:click={() => (menuAberto = !menuAberto)}
        >
          <Qualidade tamanho={18} />
          <span>{rotuloDoNivel}</span>
        </button>

        {#if menuAberto}
          <ul class="controles-opcoes">
            <li>
              <button
                class="controles-opcao"
                class:controles-opcao-ativa={nivelAtual === -1}
                type="button"
                on:click={() => {
                  despachar('nivel', -1);
                  menuAberto = false;
                }}
              >
                Automático
              </button>
            </li>
            {#each niveis as nivel (nivel.indice)}
              <li>
                <button
                  class="controles-opcao"
                  class:controles-opcao-ativa={nivelAtual === nivel.indice}
                  type="button"
                  on:click={() => {
                    despachar('nivel', nivel.indice);
                    menuAberto = false;
                  }}
                >
                  {nivel.rotulo}
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}

    <button
      class="controles-botao"
      type="button"
      aria-label="Tela cheia"
      on:click={() => despachar('telaCheia')}
    >
      <TelaCheia tamanho={20} />
    </button>
  </div>
</div>
