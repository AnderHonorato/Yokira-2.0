<!-- Arquivo: src/routes/configuracoes/+page.svelte -->
<!-- Todas as acoes desta tela passam pela dupla confirmacao — inclusive no servidor. -->
<script lang="ts">
  import './configuracoes.css';
  import BotaoPill from '$componentes/comum/botao-pill.svelte';
  import DialogoConfirmacao from '$componentes/comum/dialogo-confirmacao.svelte';
  import SeletorDeTema from '$componentes/comum/seletor-de-tema.svelte';
  import { ACOES_CRITICAS, type AcaoCritica } from '$componentes/comum/acoes-criticas';
  import { executarAcaoCritica } from '$cliente/acoes-criticas-cliente';

  export let data;
  export let form;

  let acaoAberta: AcaoCritica | null = null;
  let processando = false;
  let recado = '';

  async function confirmar() {
    if (!acaoAberta) return;
    processando = true;
    try {
      recado = await executarAcaoCritica(acaoAberta);
      acaoAberta = null;
    } catch (erro) {
      recado = erro instanceof Error ? erro.message : 'Não foi possível concluir.';
    } finally {
      processando = false;
    }
  }
</script>

<svelte:head><title>Configurações — Yōkira Animes</title></svelte:head>

<h1 class="config-titulo">Configurações</h1>

<h2 class="config-secao">Aparência</h2>
<SeletorDeTema atual={data.tema} />

{#if !data.email}
  <p class="config-subtitulo">
    <a href="/entrar">Entre na sua conta</a> para ver as opções de conta, sessões e dados.
  </p>
{:else}
  <h2 class="config-secao">Conta</h2>
  <p class="config-subtitulo">Você tem {data.sessoesAtivas} sessão(ões) ativa(s) nesta conta.</p>
{/if}

{#if data.email && !data.emailVerificado}
  <div class="config-verificacao">
    <div>
      <h2 class="config-item-titulo">E-mail não confirmado</h2>
      <p class="config-item-texto">
        Confirme <strong>{data.email}</strong> para garantir que você consegue recuperar a conta se esquecer
        a senha.
      </p>
    </div>
    <form method="POST" action="?/reenviarVerificacao">
      <BotaoPill variante="marca" tipo="submit">Reenviar confirmação</BotaoPill>
    </form>
  </div>
{/if}

{#if form?.mensagemVerificacao}
  <p class="config-recado" role="status">{form.mensagemVerificacao}</p>
{/if}

{#if recado}
  <p class="config-recado" role="status">{recado}</p>
{/if}

{#if data.email}
  <ul class="config-lista">
    {#each ACOES_CRITICAS as acao (acao.chave)}
      <li class="config-item">
        <div>
          <h2 class="config-item-titulo">{acao.titulo}</h2>
          <p class="config-item-texto">{acao.descricao}</p>
        </div>
        <BotaoPill variante="neutro" on:click={() => (acaoAberta = acao)}>
          {acao.rotuloDoBotao}
        </BotaoPill>
      </li>
    {/each}
  </ul>

  <form class="config-sair" method="POST" action="/sair">
    <BotaoPill variante="neutro" tipo="submit">Sair desta conta</BotaoPill>
  </form>
{/if}

{#if acaoAberta}
  <DialogoConfirmacao
    aberto
    titulo={acaoAberta.titulo}
    descricao={acaoAberta.descricao}
    avisoIrreversivel={acaoAberta.aviso}
    exigencia={acaoAberta.exigencia}
    {processando}
    on:confirmado={confirmar}
    on:cancelado={() => (acaoAberta = null)}
  />
{/if}
