<!-- Arquivo: src/routes/admin/registro/+page.svelte -->
<script lang="ts">
  import '../admin.css';
  import '../tabela-admin.css';
  import '../admin-formularios.css';
  import '../admin-tabela.css';

  export let data;

  const formatador = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
</script>

<svelte:head><title>Registro — Painel Yōkira</title></svelte:head>

<h1 class="admin-titulo">Registro administrativo</h1>
<p class="admin-subtitulo">As 100 ações mais recentes, da mais nova para a mais antiga.</p>

<section class="admin-secao">
  {#if data.registros.length === 0}
    <p class="admin-secao-texto">Nada registrado ainda.</p>
  {:else}
    <ul class="admin-tabela">
      {#each data.registros as registro (registro.id)}
        <li class="admin-linha">
          <span class="admin-linha-principal">
            <strong>{registro.acao}</strong>
            <span class="admin-linha-meta">
              {registro.usuario?.email ?? 'conta removida'}
              {#if registro.alvo}
                · alvo {registro.alvo}{/if}
              {#if registro.detalhe}
                · {registro.detalhe}{/if}
            </span>
          </span>
          <span class="admin-linha-meta">{formatador.format(new Date(registro.criadoEm))}</span>
        </li>
      {/each}
    </ul>
  {/if}
</section>
