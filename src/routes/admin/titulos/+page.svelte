<!-- Arquivo: src/routes/admin/titulos/+page.svelte -->
<!-- Lista de titulos com busca e o formulario de criacao. -->
<script lang="ts">
  import '../admin.css';
  import '../tabela-admin.css';
  import '../admin-formularios.css';
  import '../admin-tabela.css';
  import BotaoPill from '$componentes/comum/botao-pill.svelte';
  import Chip from '$componentes/comum/chip.svelte';
  import { CLASSIFICACOES, SITUACOES_DE_TITULO } from '$lib/validacoes/administracao';

  export let data;
  export let form;

  let criando = false;
</script>

<svelte:head><title>Títulos — Painel Yōkira</title></svelte:head>

<h1 class="admin-titulo">Títulos</h1>

<form class="admin-busca" method="GET">
  <label class="admin-campo">
    <span>Buscar por nome</span>
    <input type="search" name="busca" value={data.busca} placeholder="Nome do título" />
  </label>
  <BotaoPill variante="neutro" tipo="submit">Buscar</BotaoPill>
</form>

<section class="admin-secao">
  <div class="admin-secao-cabecalho">
    <h2 class="admin-secao-titulo">{data.titulos.length} título(s)</h2>
    <BotaoPill variante="marca" on:click={() => (criando = !criando)}>
      {criando ? 'Fechar formulário' : 'Novo título'}
    </BotaoPill>
  </div>

  {#if criando}
    <form class="admin-forma" method="POST" action="?/criar">
      <div class="admin-forma-linha">
        <label class="admin-campo">
          <span>Nome</span>
          <input name="nome" required maxlength="120" />
        </label>
        <label class="admin-campo">
          <span>Slug</span>
          <input name="slug" placeholder="deixe em branco para gerar do nome" maxlength="80" />
        </label>
      </div>

      <label class="admin-campo">
        <span>Sinopse</span>
        <textarea name="sinopse" rows="3" required minlength="20" maxlength="2000"></textarea>
      </label>

      <div class="admin-forma-linha">
        <label class="admin-campo">
          <span>Ano</span>
          <input type="number" name="ano" required value={new Date().getFullYear()} />
        </label>
        <label class="admin-campo">
          <span>Classificação</span>
          <select name="classificacao">
            {#each CLASSIFICACOES as valor (valor)}
              <option value={valor} selected={valor === '16'}>{valor}</option>
            {/each}
          </select>
        </label>
        <label class="admin-campo">
          <span>Situação</span>
          <select name="situacao">
            {#each SITUACOES_DE_TITULO as valor (valor)}
              <option value={valor} selected={valor === 'RASCUNHO'}>{valor}</option>
            {/each}
          </select>
        </label>
      </div>

      <fieldset class="admin-grupo">
        <legend>Gêneros</legend>
        {#each data.generos as genero (genero.id)}
          <label class="admin-marcador">
            <input type="checkbox" name="generos" value={genero.id} />
            <span>{genero.nome}</span>
          </label>
        {/each}
      </fieldset>

      <fieldset class="admin-grupo">
        <legend>Trilhas</legend>
        <label class="admin-marcador"
          ><input type="checkbox" name="destaque" /><span>Destaque no hero</span></label
        >
        <label class="admin-marcador"
          ><input type="checkbox" name="novidade" /><span>Novidade</span></label
        >
        <label class="admin-marcador"
          ><input type="checkbox" name="emAlta" /><span>Em alta</span></label
        >
      </fieldset>

      {#if form?.mensagem}
        <p class="admin-erro" role="alert">{form.mensagem}</p>
      {/if}

      <BotaoPill variante="marca" tipo="submit">Criar título</BotaoPill>
    </form>
  {/if}

  {#if data.titulos.length === 0}
    <p class="admin-secao-texto">Nenhum título encontrado.</p>
  {:else}
    <ul class="admin-tabela">
      {#each data.titulos as titulo (titulo.id)}
        <li class="admin-linha">
          <a class="admin-linha-principal" href={`/admin/titulos/${titulo.id}`}>
            <strong>{titulo.nome}</strong>
            <span class="admin-linha-meta">
              {titulo.ano} · {titulo._count.temporadas} temporada(s) · /{titulo.slug}
            </span>
          </a>
          <span class="admin-linha-marcas">
            {#if titulo.destaque}<Chip variante="roxo">Destaque</Chip>{/if}
            <Chip variante={titulo.situacao === 'PUBLICADO' ? 'roxo' : 'neutro'}>
              {titulo.situacao}
            </Chip>
          </span>
        </li>
      {/each}
    </ul>
  {/if}
</section>
