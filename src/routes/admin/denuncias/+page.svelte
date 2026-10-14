<!-- Arquivo: src/routes/admin/denuncias/+page.svelte -->
<script lang="ts">
  import '../admin.css';
  import '../tabela-admin.css';
  import '../admin-formularios.css';
  import '../admin-tabela.css';
  import BotaoPill from '$componentes/comum/botao-pill.svelte';
  import Chip from '$componentes/comum/chip.svelte';

  export let data;
  export let form;

  const formatador = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
</script>

<svelte:head><title>Denúncias — Painel Yōkira</title></svelte:head>

<h1 class="admin-titulo">Denúncias</h1>

{#if form?.mensagem}<p class="admin-recado" role="status">{form.mensagem}</p>{/if}

<nav class="admin-abas" aria-label="Filtrar denúncias">
  <a class="admin-aba" class:admin-aba-ativa={!data.resolvidas} href="/admin/denuncias">Abertas</a>
  <a class="admin-aba" class:admin-aba-ativa={data.resolvidas} href="/admin/denuncias?resolvidas=1">
    Resolvidas
  </a>
</nav>

<section class="admin-secao">
  {#if data.denuncias.length === 0}
    <p class="admin-secao-texto">
      {data.resolvidas ? 'Nenhuma denúncia resolvida ainda.' : 'Nenhuma denúncia aberta.'}
    </p>
  {:else}
    <ul class="admin-tabela">
      {#each data.denuncias as denuncia (denuncia.id)}
        <li class="admin-linha">
          <span class="admin-linha-principal">
            <strong>{denuncia.motivo}</strong>
            <span class="admin-linha-meta">
              {denuncia.referencia} ·
              {denuncia.usuario?.email ?? 'conta removida'} ·
              {formatador.format(new Date(denuncia.criadoEm))}
            </span>
          </span>

          <span class="admin-linha-marcas">
            <Chip variante={denuncia.resolvida ? 'neutro' : 'roxo'}>
              {denuncia.resolvida ? 'Resolvida' : 'Aberta'}
            </Chip>
            <form method="POST" action="?/alternar">
              <input type="hidden" name="id" value={denuncia.id} />
              <input type="hidden" name="resolvida" value={denuncia.resolvida ? '0' : '1'} />
              <BotaoPill variante="neutro" tipo="submit">
                {denuncia.resolvida ? 'Reabrir' : 'Marcar resolvida'}
              </BotaoPill>
            </form>
          </span>
        </li>
      {/each}
    </ul>
  {/if}
</section>
