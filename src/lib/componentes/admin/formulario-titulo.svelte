<!-- Arquivo: src/lib/componentes/admin/formulario-titulo.svelte -->
<!-- Campos do titulo. Separado da pagina pra criacao e edicao nao divergirem com o tempo. -->
<script lang="ts">
  import BotaoPill from '$componentes/comum/botao-pill.svelte';
  import { CLASSIFICACOES, SITUACOES_DE_TITULO } from '$lib/validacoes/administracao';

  interface GeneroDisponivel {
    id: string;
    nome: string;
  }

  export let titulo: {
    nome: string;
    slug: string;
    sinopse: string;
    ano: number;
    classificacao: string;
    tipo: string;
    situacao: string;
    destaque: boolean;
    novidade: boolean;
    emAlta: boolean;
    popularidade: number;
    generos: { generoId: string }[];
  };
  export let generos: GeneroDisponivel[];
  export let mensagem: string | undefined = undefined;

  $: selecionados = new Set(titulo.generos.map((ligacao) => ligacao.generoId));
</script>

<form class="admin-forma" method="POST" action="?/salvar">
  <div class="admin-forma-linha">
    <label class="admin-campo">
      <span>Nome</span>
      <input name="nome" value={titulo.nome} required maxlength="120" />
    </label>
    <label class="admin-campo">
      <span>Slug</span>
      <input name="slug" value={titulo.slug} required maxlength="80" />
    </label>
  </div>

  <label class="admin-campo">
    <span>Sinopse</span>
    <textarea name="sinopse" rows="4" required minlength="20" maxlength="2000"
      >{titulo.sinopse}</textarea
    >
  </label>

  <div class="admin-forma-linha">
    <label class="admin-campo">
      <span>Ano</span>
      <input type="number" name="ano" value={titulo.ano} required />
    </label>
    <label class="admin-campo">
      <span>Classificação</span>
      <select name="classificacao">
        {#each CLASSIFICACOES as valor (valor)}
          <option value={valor} selected={valor === titulo.classificacao}>{valor}</option>
        {/each}
      </select>
    </label>
    <label class="admin-campo">
      <span>Tipo</span>
      <select name="tipo">
        <option value="SERIE" selected={titulo.tipo !== 'FILME'}>Série</option>
        <option value="FILME" selected={titulo.tipo === 'FILME'}>Filme</option>
      </select>
      <!-- Filme ja nasce com a temporada e o episodio unicos criados: quem cadastra
           nao precisa inventar uma "temporada 1" que so existe pro banco. -->
    </label>

    <label class="admin-campo">
      <span>Situação</span>
      <select name="situacao">
        {#each SITUACOES_DE_TITULO as valor (valor)}
          <option value={valor} selected={valor === titulo.situacao}>{valor}</option>
        {/each}
      </select>
    </label>
    <label class="admin-campo">
      <span>Popularidade</span>
      <input type="number" name="popularidade" value={titulo.popularidade} min="0" />
    </label>
  </div>

  <fieldset class="admin-grupo">
    <legend>Gêneros</legend>
    {#each generos as genero (genero.id)}
      <label class="admin-marcador">
        <input
          type="checkbox"
          name="generos"
          value={genero.id}
          checked={selecionados.has(genero.id)}
        />
        <span>{genero.nome}</span>
      </label>
    {/each}
  </fieldset>

  <fieldset class="admin-grupo">
    <legend>Trilhas</legend>
    <label class="admin-marcador">
      <input type="checkbox" name="destaque" checked={titulo.destaque} /><span
        >Destaque no hero</span
      >
    </label>
    <label class="admin-marcador">
      <input type="checkbox" name="novidade" checked={titulo.novidade} /><span>Novidade</span>
    </label>
    <label class="admin-marcador">
      <input type="checkbox" name="emAlta" checked={titulo.emAlta} /><span>Em alta</span>
    </label>
  </fieldset>

  {#if mensagem}
    <p class="admin-recado" role="status">{mensagem}</p>
  {/if}

  <BotaoPill variante="marca" tipo="submit">Salvar título</BotaoPill>
</form>
