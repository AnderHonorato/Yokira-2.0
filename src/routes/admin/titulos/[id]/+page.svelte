<!-- Arquivo: src/routes/admin/titulos/[id]/+page.svelte -->
<!-- Edicao do titulo. Tudo que apaga passa pelo dialogo de dupla confirmacao — e o
     servidor ainda exige o token de uso unico, entao pular a tela nao adianta. -->
<script lang="ts">
  import '../../admin.css';
  import '../../tabela-admin.css';
  import '../../admin-formularios.css';
  import '../../admin-tabela.css';
  import { invalidateAll } from '$app/navigation';
  import BotaoPill from '$componentes/comum/botao-pill.svelte';
  import DialogoConfirmacao from '$componentes/comum/dialogo-confirmacao.svelte';
  import FormularioTitulo from '$componentes/admin/formulario-titulo.svelte';
  import TemporadasEEpisodios from '$componentes/admin/temporadas-e-episodios.svelte';
  import EscolherCapa from '$componentes/admin/escolher-capa.svelte';
  import { executarAcaoAdministrativa } from '$cliente/acoes-administrativas';
  import { avisar, avisarErro } from '$cliente/avisos';

  export let data;
  export let form;

  interface AcaoPendente {
    acao: string;
    alvo: string;
    titulo: string;
    descricao: string;
    aviso: string;
    palavraChave?: string;
  }

  // Lista chata de montar no markup: os episodios vivem dentro das temporadas, e o
  // seletor de "recortar do video" precisa deles achatados com um rotulo legivel.
  $: episodiosDoTitulo = data.titulo.temporadas.flatMap((temporada) =>
    temporada.episodios.map((episodio) => ({
      id: episodio.id,
      rotulo: `T${temporada.numero} EP${episodio.numero} — ${episodio.nome}`
    }))
  );

  let pendente: AcaoPendente | null = null;
  let processando = false;

  async function confirmar() {
    if (!pendente) return;
    processando = true;
    try {
      await executarAcaoAdministrativa(pendente.acao, pendente.alvo);
      avisar(`${pendente.titulo}: concluído.`, 'sucesso');
      pendente = null;
      await invalidateAll();
    } catch (erro) {
      avisarErro(erro);
    } finally {
      processando = false;
    }
  }
</script>

<svelte:head><title>{data.titulo.nome} — Painel Yōkira</title></svelte:head>

<a class="admin-voltar" href="/admin/titulos">← Todos os títulos</a>
<h1 class="admin-titulo">{data.titulo.nome}</h1>

<section class="admin-secao">
  <h2 class="admin-secao-titulo">Dados do título</h2>
  <FormularioTitulo titulo={data.titulo} generos={data.generos} mensagem={form?.mensagem} />
</section>

<section class="admin-secao">
  <h2 class="admin-secao-titulo">Capas</h2>
  <p class="admin-subtitulo">
    Envie uma imagem ou recorte um quadro de um episódio que já tenha vídeo.
  </p>
  <div class="admin-capas">
    <EscolherCapa
      acao="?/definirCapa"
      rotulo="Pôster (card em pé)"
      alvo="poster"
      atual={data.titulo.posterUrl}
      episodios={episodiosDoTitulo}
    />
    <EscolherCapa
      acao="?/definirCapa"
      rotulo="Arte do topo (banner deitado)"
      alvo="hero"
      atual={data.titulo.arteHeroUrl}
      episodios={episodiosDoTitulo}
    />
  </div>
</section>

<TemporadasEEpisodios
  temporadas={data.titulo.temporadas}
  on:apagarTemporada={(evento) =>
    (pendente = {
      acao: 'excluir-temporada',
      alvo: evento.detail.id,
      titulo: `Excluir temporada ${evento.detail.numero}`,
      descricao: `Remove a temporada ${evento.detail.numero} e todos os episódios dela.`,
      aviso: 'Os episódios, o progresso de exibição e os arquivos ligados somem junto.'
    })}
  on:apagarEpisodio={(evento) =>
    (pendente = {
      acao: 'excluir-episodio',
      alvo: evento.detail.id,
      titulo: `Excluir episódio ${evento.detail.numero}`,
      descricao: `Remove "${evento.detail.nome}" e o progresso de quem já assistiu.`,
      aviso: 'Esta ação não pode ser desfeita.'
    })}
/>

<section class="admin-secao admin-secao-perigo">
  <h2 class="admin-secao-titulo">Zona de risco</h2>
  <div class="admin-perigo-acoes">
    <BotaoPill
      variante="neutro"
      on:click={() =>
        (pendente = {
          acao: 'despublicar-conteudo',
          alvo: data.titulo.id,
          titulo: 'Despublicar título',
          descricao: 'O título sai do catálogo público, mas continua no painel.',
          aviso: 'Quem estiver assistindo perde o acesso na próxima navegação.'
        })}
    >
      Despublicar
    </BotaoPill>

    <BotaoPill
      variante="neutro"
      on:click={() =>
        (pendente = {
          acao: 'excluir-titulo',
          alvo: data.titulo.id,
          titulo: 'Excluir título',
          descricao: 'Remove o título, temporadas, episódios, avaliações e listas.',
          aviso: 'Esta ação é definitiva e não pode ser desfeita.',
          palavraChave: 'EXCLUIR'
        })}
    >
      Excluir título
    </BotaoPill>
  </div>
</section>

{#if pendente}
  <DialogoConfirmacao
    aberto
    titulo={pendente.titulo}
    descricao={pendente.descricao}
    avisoIrreversivel={pendente.aviso}
    exigencia={pendente.palavraChave
      ? { palavraChave: pendente.palavraChave }
      : { rotuloDaCaixa: 'Entendi que esta ação não pode ser desfeita' }}
    {processando}
    on:confirmado={confirmar}
    on:cancelado={() => (pendente = null)}
  />
{/if}
