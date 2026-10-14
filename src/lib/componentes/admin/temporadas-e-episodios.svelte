<!-- Arquivo: src/lib/componentes/admin/temporadas-e-episodios.svelte -->
<!-- Temporadas, episodios e os formularios de criacao/edicao. As acoes que APAGAM
     apenas despacham o evento: quem abre o dialogo de dupla confirmacao e a pagina.
     O campo de estreia vazio significa "no ar agora"; com data futura o episodio fica
     visivel so aqui no painel ate a hora chegar. -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import BotaoPill from '$componentes/comum/botao-pill.svelte';
  import Chip from '$componentes/comum/chip.svelte';
  import EscolherCapa from './escolher-capa.svelte';
  import CriarEpisodiosEmLote from './criar-episodios-em-lote.svelte';
  import { agendado, paraCampoLocal, rotuloDeEstreia } from './estreia-no-formulario';

  interface EpisodioListado {
    id: string;
    numero: number;
    nome: string;
    duracaoSegundos: number;
    publicadoEm: Date;
    miniaturaUrl: string | null;
    _count: { arquivos: number };
  }

  interface TemporadaListada {
    id: string;
    numero: number;
    nome: string;
    episodios: EpisodioListado[];
  }

  export let temporadas: TemporadaListada[];

  const despachar = createEventDispatcher<{
    apagarTemporada: TemporadaListada;
    apagarEpisodio: EpisodioListado;
  }>();

  let editando: string | null = null;
</script>

<section class="admin-secao">
  <h2 class="admin-secao-titulo">Temporadas e episódios</h2>

  <form class="admin-forma-inline" method="POST" action="?/criarTemporada">
    <label class="admin-campo">
      <span>Número</span>
      <input type="number" name="numero" min="1" max="99" required />
    </label>
    <label class="admin-campo admin-campo-largo">
      <span>Nome da temporada</span>
      <input name="nome" required maxlength="80" placeholder="Primeira temporada" />
    </label>
    <BotaoPill variante="neutro" tipo="submit">Adicionar temporada</BotaoPill>
  </form>

  {#if temporadas.length === 0}
    <p class="admin-secao-texto">Nenhuma temporada ainda.</p>
  {/if}

  {#each temporadas as temporada (temporada.id)}
    <article class="admin-temporada">
      <header class="admin-temporada-cabecalho">
        <h3>T{temporada.numero} · {temporada.nome}</h3>
        <BotaoPill variante="neutro" on:click={() => despachar('apagarTemporada', temporada)}>
          Excluir temporada
        </BotaoPill>
      </header>

      <ul class="admin-episodios">
        {#each temporada.episodios as episodio (episodio.id)}
          <li class="admin-episodio">
            {#if editando === episodio.id}
              <form class="admin-forma-inline" method="POST" action="?/salvarEpisodio">
                <input type="hidden" name="episodioId" value={episodio.id} />
                <label class="admin-campo">
                  <span>Nº</span>
                  <input type="number" name="numero" value={episodio.numero} min="1" required />
                </label>
                <label class="admin-campo admin-campo-largo">
                  <span>Nome</span>
                  <input name="nome" value={episodio.nome} required maxlength="160" />
                </label>
                <label class="admin-campo">
                  <span>Min</span>
                  <input
                    type="number"
                    name="duracao"
                    value={Math.round(episodio.duracaoSegundos / 60)}
                    min="1"
                    required
                  />
                </label>
                <label class="admin-campo">
                  <span>Estreia</span>
                  <input
                    type="datetime-local"
                    name="estreia"
                    value={paraCampoLocal(episodio.publicadoEm)}
                  />
                </label>
                <BotaoPill variante="marca" tipo="submit">Salvar</BotaoPill>
                <BotaoPill variante="neutro" on:click={() => (editando = null)}>Cancelar</BotaoPill>
              </form>

              <!-- Sem episodio escolhido, o quadro sai do video deste mesmo episodio. -->
              <EscolherCapa
                acao="?/definirCapa"
                alvo="episodio"
                rotulo="Miniatura do episódio"
                episodioId={episodio.id}
                atual={episodio.miniaturaUrl}
              />
            {:else}
              <span class="admin-episodio-nome">
                {episodio.numero}. {episodio.nome}
                <span class="admin-linha-meta">{Math.round(episodio.duracaoSegundos / 60)}min</span>
              </span>
              <span class="admin-episodio-acoes">
                {#if agendado(episodio.publicadoEm)}
                  <Chip variante="neutro">Estreia {rotuloDeEstreia(episodio.publicadoEm)}</Chip>
                {/if}
                {#if episodio._count.arquivos > 0}
                  <Chip variante="roxo">Vídeo enviado</Chip>
                {:else}
                  <Chip variante="neutro">Sem vídeo</Chip>
                {/if}
                <BotaoPill variante="neutro" on:click={() => (editando = episodio.id)}>
                  Editar
                </BotaoPill>
                <BotaoPill variante="neutro" on:click={() => despachar('apagarEpisodio', episodio)}>
                  Excluir
                </BotaoPill>
              </span>
            {/if}
          </li>
        {/each}
      </ul>

      <CriarEpisodiosEmLote
        temporadaId={temporada.id}
        proximoNumero={Math.max(0, ...temporada.episodios.map((e) => e.numero)) + 1}
      />

      <form class="admin-forma-inline" method="POST" action="?/criarEpisodio">
        <input type="hidden" name="temporadaId" value={temporada.id} />
        <label class="admin-campo">
          <span>Nº</span>
          <input type="number" name="numero" min="1" required />
        </label>
        <label class="admin-campo admin-campo-largo">
          <span>Nome do episódio</span>
          <input name="nome" required maxlength="160" />
        </label>
        <label class="admin-campo">
          <span>Min</span>
          <input type="number" name="duracao" min="1" value="24" required />
        </label>
        <label class="admin-campo">
          <span>Estreia</span>
          <input type="datetime-local" name="estreia" />
        </label>
        <BotaoPill variante="neutro" tipo="submit">Adicionar episódio</BotaoPill>
      </form>
    </article>
  {/each}
</section>
