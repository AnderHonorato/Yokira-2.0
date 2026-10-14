<!-- Arquivo: src/routes/admin/enviar/+page.svelte -->
<!-- Duas origens pro mesmo destino: arquivo do computador ou link direto. O radio
     escolhe qual campo fica de pe, pra ninguem preencher os dois e ficar em duvida
     sobre qual valeu. -->
<script lang="ts">
  import '../admin.css';
  import '../../formulario-conta.css';
  import BotaoPill from '$componentes/comum/botao-pill.svelte';
  import Upload from '$visual/icones/upload.svelte';

  export let data;
  export let form;

  let origem: 'arquivo' | 'link' = 'arquivo';
</script>

<svelte:head><title>Enviar episódio — Yōkira Animes</title></svelte:head>

<h1 class="admin-titulo">Enviar episódio</h1>
<p class="admin-subtitulo">Formatos aceitos: mp4, mkv, mov e webm.</p>

<form class="conta-forma" method="POST" enctype="multipart/form-data">
  <label class="conta-campo">
    <span>Episódio</span>
    <select name="episodioId" required>
      {#each data.episodios as episodio (episodio.id)}
        <option value={episodio.id}>{episodio.rotulo}</option>
      {/each}
    </select>
  </label>

  <fieldset class="admin-origem">
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
      <input type="file" name="arquivo" accept="video/*" required />
    </label>
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
      <!-- O download acontece no servidor, entao o aviso importa: quem cola o link
           precisa saber que ele tem que ser publico e apontar pro arquivo em si. -->
      <small class="admin-dica">
        O servidor baixa o arquivo. Precisa ser um link público e direto para o vídeo, não uma
        página de player. Endereços de rede interna são recusados.
      </small>
    </label>
  {/if}

  {#if form?.mensagem}
    <p class="conta-erro" role="status">{form.mensagem}</p>
  {/if}

  <BotaoPill variante="marca" tipo="submit"><Upload tamanho={16} /> Enviar</BotaoPill>
</form>
