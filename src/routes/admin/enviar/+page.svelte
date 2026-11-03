<!-- Arquivo: src/routes/admin/enviar/+page.svelte -->
<!-- Arquivo envia bytes diretamente; link continua usando a action tradicional. -->
<script lang="ts">
  import '../admin.css';
  import '../../formulario-conta.css';
  import './upload-direto.css';
  import BotaoPill from '$componentes/comum/botao-pill.svelte';
  import Upload from '$visual/icones/upload.svelte';
  import SetaDireita from '$visual/icones/seta-direita.svelte';

  export let data;
  export let form;

  let origem: 'arquivo' | 'link' = 'arquivo';
  let enviando = false;
  let progresso = 0;
  let mensagem = '';
  let envioConcluido = false;
  let requisicao: XMLHttpRequest | null = null;

  function enviarArquivo(evento: SubmitEvent): void {
    if (origem !== 'arquivo') return;
    evento.preventDefault();
    if (enviando) return;
    envioConcluido = false;

    const formulario = evento.currentTarget as HTMLFormElement;
    const dados = new FormData(formulario);
    const arquivo = dados.get('arquivo');
    const episodioId = String(dados.get('episodioId') ?? '');

    if (!(arquivo instanceof File) || arquivo.size === 0 || !episodioId) {
      mensagem = 'Selecione um episódio e um arquivo de vídeo.';
      return;
    }
    if (arquivo.size > 8 * 1024 * 1024 * 1024) {
      mensagem = 'O arquivo excede o limite de 8 GB.';
      return;
    }

    enviando = true;
    progresso = 0;
    mensagem = 'Enviando vídeo ao servidor…';

    const pedido = new XMLHttpRequest();
    requisicao = pedido;
    pedido.open('POST', `/api/admin/enviar-video?episodioId=${encodeURIComponent(episodioId)}`);
    pedido.setRequestHeader('Content-Type', 'application/octet-stream');
    pedido.setRequestHeader('X-Nome-Arquivo', encodeURIComponent(arquivo.name));

    pedido.upload.onprogress = (andamento) => {
      if (andamento.lengthComputable && andamento.total > 0) {
        progresso = Math.min(100, Math.round((andamento.loaded / andamento.total) * 100));
      }
    };

    pedido.onload = () => {
      let resposta: { mensagem?: string; message?: string } = {};
      try {
        resposta = JSON.parse(pedido.responseText);
      } catch {
        // Resposta de erro sem JSON, como o limite do proxy reverso.
      }
      if (pedido.status >= 200 && pedido.status < 300) {
        progresso = 100;
        envioConcluido = true;
        mensagem = resposta.mensagem ?? 'Vídeo recebido. Aguardando conversão HLS.';
        formulario.reset();
      } else {
        mensagem =
          resposta.mensagem ??
          resposta.message ??
          `Falha no envio (HTTP ${pedido.status}). Tente novamente.`;
      }
    };
    pedido.onerror = () => {
      mensagem = 'Falha de conexão durante o envio. Verifique sua rede.';
    };
    pedido.onabort = () => {
      mensagem = 'Envio cancelado.';
    };
    pedido.onloadend = () => {
      enviando = false;
      requisicao = null;
    };
    pedido.send(arquivo);
  }
</script>

<svelte:head><title>Enviar episódio — Yōkira Animes</title></svelte:head>

<h1 class="admin-titulo">Enviar episódio</h1>
<p class="admin-subtitulo">Formatos aceitos: mp4, mkv, mov e webm. Limite: 8 GB.</p>

<form class="conta-forma" method="POST" enctype="multipart/form-data" on:submit={enviarArquivo}>
  <label class="conta-campo">
    <span>Episódio</span>
    <select name="episodioId" required disabled={enviando}>
      {#each data.episodios as episodio (episodio.id)}
        <option value={episodio.id}>{episodio.rotulo}</option>
      {/each}
    </select>
  </label>

  <fieldset class="admin-origem" disabled={enviando}>
    <legend>De onde vem o vídeo</legend>
    <label class="admin-origem-opcao">
      <input type="radio" name="origem" value="arquivo" bind:group={origem} />
      <span>Arquivo do computador</span>
    </label>
    <label class="admin-origem-opcao">
      <input type="radio" name="origem" value="link" bind:group={origem} />
      <span>Link direto</span>
    </label>
  </fieldset>

  {#if origem === 'arquivo'}
    <label class="conta-campo">
      <span>Arquivo de vídeo</span>
      <input
        type="file"
        name="arquivo"
        accept=".mp4,.mkv,.mov,.webm,video/*"
        required
        disabled={enviando}
      />
    </label>
    <small class="admin-dica">
      O vídeo é enviado em fluxo, sem carregar o arquivo inteiro na memória do servidor.
    </small>
  {:else}
    <label class="conta-campo">
      <span>Link do vídeo</span>
      <input
        type="url"
        name="link"
        required
        placeholder="https://exemplo.com/episodio.mp4"
        inputmode="url"
      />
      <small class="admin-dica">
        O servidor baixa o vídeo de um link público direto. Endereços internos são recusados.
      </small>
    </label>
  {/if}

  {#if enviando}
    <div class="admin-envio-estado">
      <label for="progresso-video">Transferência: {progresso}%</label>
      <progress id="progresso-video" class="admin-envio-progresso" value={progresso} max="100"
      ></progress>
      <BotaoPill variante="neutro" tipo="button" on:click={() => requisicao?.abort()}>
        Cancelar envio
      </BotaoPill>
    </div>
  {/if}

  {#if mensagem || form?.mensagem}
    <p class="admin-envio-mensagem" role="status" aria-live="polite">
      {mensagem || form?.mensagem}
    </p>
  {/if}
  {#if envioConcluido || form?.enfileirado}
    <a class="admin-envio-acompanhar" href="/admin">
      Acompanhar conversão no painel
      <SetaDireita tamanho={16} />
    </a>
  {/if}

  <BotaoPill variante="marca" tipo="submit" desabilitado={enviando}>
    <Upload tamanho={16} />
    {enviando ? 'Enviando…' : 'Enviar'}
  </BotaoPill>
</form>
