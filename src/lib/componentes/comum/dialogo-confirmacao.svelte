<!-- Arquivo: src/lib/componentes/comum/dialogo-confirmacao.svelte -->
<!-- Dupla confirmacao propria. Nunca usamos confirm() nativo: precisamos do passo 2 ativo
     (digitar a palavra ou marcar a caixa) com o botao desabilitado ate isso acontecer. -->
<script lang="ts">
  import './dialogo-confirmacao.css';
  import { createEventDispatcher } from 'svelte';
  import BotaoPill from './botao-pill.svelte';
  import Fechar from '$visual/icones/fechar.svelte';
  import Girador from './girador.svelte';
  import { podeConfirmar, rotuloDoPasso, type ExigenciaDoPasso2 } from './dialogo-confirmacao';

  export let aberto = false;
  export let titulo: string;
  export let descricao: string;
  export let avisoIrreversivel: string;
  export let exigencia: ExigenciaDoPasso2 = {
    rotuloDaCaixa: 'Entendi que esta ação não pode ser desfeita'
  };
  export let processando = false;

  const despachar = createEventDispatcher<{ confirmado: void; cancelado: void }>();

  let passo: 1 | 2 = 1;
  let textoDigitado = '';
  let caixaMarcada = false;

  $: liberado = podeConfirmar(exigencia, textoDigitado, caixaMarcada);

  function fechar() {
    passo = 1;
    textoDigitado = '';
    caixaMarcada = false;
    despachar('cancelado');
  }

  function aoTeclar(evento: KeyboardEvent) {
    if (evento.key === 'Escape') fechar();
  }
</script>

<svelte:window on:keydown={aberto ? aoTeclar : undefined} />

{#if aberto}
  <div class="dialogo-fundo" role="presentation" on:click|self={fechar}>
    <div class="dialogo" role="alertdialog" aria-modal="true" aria-labelledby="dialogo-titulo">
      <div class="dialogo-topo">
        <span class="dialogo-passo">{rotuloDoPasso(passo)}</span>
        <button class="dialogo-fechar" type="button" on:click={fechar} aria-label="Fechar">
          <Fechar tamanho={18} />
        </button>
      </div>

      <h2 class="dialogo-titulo" id="dialogo-titulo">{titulo}</h2>

      {#if passo === 1}
        <p class="dialogo-texto">{descricao}</p>
        <p class="dialogo-aviso">{avisoIrreversivel}</p>
        <div class="dialogo-acoes">
          <BotaoPill variante="neutro" on:click={fechar}>Cancelar</BotaoPill>
          <BotaoPill variante="marca" on:click={() => (passo = 2)}>Continuar</BotaoPill>
        </div>
      {:else}
        {#if exigencia.palavraChave}
          <label class="dialogo-rotulo" for="dialogo-palavra">
            Digite <strong>{exigencia.palavraChave}</strong> para liberar o botão.
          </label>
          <input
            id="dialogo-palavra"
            class="dialogo-campo"
            type="text"
            autocomplete="off"
            bind:value={textoDigitado}
          />
        {:else}
          <label class="dialogo-caixa">
            <input type="checkbox" bind:checked={caixaMarcada} />
            <span>{exigencia.rotuloDaCaixa}</span>
          </label>
        {/if}

        <div class="dialogo-acoes">
          <BotaoPill variante="neutro" on:click={fechar}>Cancelar</BotaoPill>
          <BotaoPill
            variante="marca"
            desabilitado={!liberado || processando}
            on:click={() => despachar('confirmado')}
          >
            {#if processando}<Girador />{/if}
            Confirmar
          </BotaoPill>
        </div>
      {/if}
    </div>
  </div>
{/if}
