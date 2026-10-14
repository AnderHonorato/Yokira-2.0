<!-- Arquivo: src/routes/admin/+page.svelte -->
<!-- Painel administrativo: numeros, estado do ffmpeg e fila de processamento. -->
<script lang="ts">
  import './admin.css';
  import './tabela-admin.css';
  import './admin-formularios.css';
  import './admin-tabela.css';
  import Upload from '$visual/icones/upload.svelte';
  import Verificado from '$visual/icones/verificado.svelte';
  import Chip from '$componentes/comum/chip.svelte';
  import BotaoPill from '$componentes/comum/botao-pill.svelte';

  export let data;

  const SITUACAO_EM_TEXTO: Record<string, string> = {
    NA_FILA: 'Na fila',
    PROCESSANDO: 'Processando',
    CONCLUIDO: 'Concluído',
    FALHOU: 'Falhou'
  };
</script>

<svelte:head><title>Painel — Yōkira Animes</title></svelte:head>

<h1 class="admin-titulo">Painel administrativo</h1>
<p class="admin-subtitulo">Entrou como {data.usuario.nome} ({data.usuario.papel}).</p>

<nav class="admin-atalhos" aria-label="Áreas do painel">
  <a class="admin-atalho" href="/admin/titulos">
    <strong>Títulos</strong>
    <span>Criar, editar, publicar e organizar temporadas e episódios</span>
  </a>
  {#if data.podeModerar}
    <a class="admin-atalho" href="/admin/denuncias">
      <strong>Denúncias</strong>
      <span>
        {data.denunciasAbertas === 0
          ? 'Nenhuma denúncia aberta'
          : `${data.denunciasAbertas} denúncia(s) aberta(s)`}
      </span>
    </a>
    <a class="admin-atalho" href="/admin/registro">
      <strong>Registro</strong>
      <span>Quem fez o quê, da ação mais recente para a mais antiga</span>
    </a>
  {/if}
  {#if data.podeGerirUsuarios}
    <a class="admin-atalho" href="/admin/usuarios">
      <strong>Usuários</strong>
      <span>Contas, papéis e remoção</span>
    </a>
  {/if}
</nav>

<div class="admin-numeros">
  <div class="admin-cartao"><strong>{data.titulos}</strong><span>títulos</span></div>
  <div class="admin-cartao"><strong>{data.episodios}</strong><span>episódios</span></div>
  <div class="admin-cartao">
    <strong class="admin-ffmpeg" class:admin-ffmpeg-ok={data.temFfmpeg}>
      <Verificado tamanho={18} />
    </strong>
    <span>{data.temFfmpeg ? 'FFmpeg disponível' : 'FFmpeg ausente'}</span>
  </div>
</div>

<section class="admin-secao">
  <h2 class="admin-secao-titulo"><Upload tamanho={18} /> Enviar episódio</h2>
  <p class="admin-secao-texto">
    O envio grava o original fora de <code>static/</code> e enfileira a geração do HLS em 360p, 720p e
    1080p. Use apenas arquivos que você tem direito de distribuir.
  </p>
  <BotaoPill variante="marca" href="/admin/enviar">Abrir formulário de envio</BotaoPill>
</section>

<section class="admin-secao">
  <h2 class="admin-secao-titulo">Fila de processamento</h2>
  {#if data.trabalhos.length === 0}
    <p class="admin-secao-texto">Nenhum trabalho registrado ainda.</p>
  {:else}
    <ul class="admin-fila">
      {#each data.trabalhos as trabalho (trabalho.id)}
        <li class="admin-fila-item">
          <Chip variante={trabalho.situacao === 'FALHOU' ? 'neutro' : 'roxo'}>
            {SITUACAO_EM_TEXTO[trabalho.situacao] ?? trabalho.situacao}
          </Chip>
          <span>{trabalho.progresso}%</span>
          {#if trabalho.mensagem}<span class="admin-fila-erro">{trabalho.mensagem}</span>{/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>
