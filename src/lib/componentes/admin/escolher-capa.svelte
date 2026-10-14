<!-- Arquivo: src/lib/componentes/admin/escolher-capa.svelte -->
<!-- Uma capa vem de imagem enviada ou de um quadro do proprio video. O mesmo bloco
     serve pro poster, pra arte do topo e pra miniatura do episodio: sao a mesma
     pergunta feita tres vezes, e duplicar o formulario seria pedir divergencia. -->
<script lang="ts">
  import './escolher-capa.css';
  import BotaoPill from '$componentes/comum/botao-pill.svelte';

  export let acao: string;
  export let rotulo: string;
  /** 'poster' ou 'hero' na capa do titulo; vazio na miniatura do episodio. */
  export let alvo = '';
  export let episodioId = '';
  export let episodios: Array<{ id: string; rotulo: string }> = [];
  /** Capa que esta valendo agora, so pra conferencia visual. */
  export let atual: string | null = null;

  let origem: 'imagem' | 'quadro' = 'imagem';
</script>

<form class="capa" method="POST" action={acao} enctype="multipart/form-data">
  <h3 class="capa-titulo">{rotulo}</h3>

  {#if atual}
    <img class="capa-atual" src={atual} alt={`Capa atual: ${rotulo}`} />
  {:else}
    <p class="capa-vazia">Nenhuma capa definida. A arte é gerada por enquanto.</p>
  {/if}

  {#if alvo}<input type="hidden" name="alvo" value={alvo} />{/if}
  {#if episodioId}<input type="hidden" name="episodioId" value={episodioId} />{/if}

  <div class="capa-origens">
    <label class="capa-origem">
      <input type="radio" value="imagem" bind:group={origem} />
      <span>Enviar imagem</span>
    </label>
    <label class="capa-origem">
      <input type="radio" value="quadro" bind:group={origem} />
      <span>Recortar do vídeo</span>
    </label>
  </div>

  {#if origem === 'imagem'}
    <label class="capa-campo">
      <span>Arquivo de imagem</span>
      <input type="file" name="imagem" accept="image/jpeg,image/png,image/webp" required />
      <small class="capa-dica">JPEG, PNG ou WebP, até 8 MB.</small>
    </label>
  {:else}
    {#if episodios.length > 0}
      <label class="capa-campo">
        <span>Episódio de onde recortar</span>
        <select name="episodioDaCapa" required>
          {#each episodios as episodio (episodio.id)}
            <option value={episodio.id}>{episodio.rotulo}</option>
          {/each}
        </select>
      </label>
    {/if}
    <label class="capa-campo">
      <span>Segundo do vídeo</span>
      <input type="number" name="segundo" min="0" step="0.5" value="0" required />
      <small class="capa-dica">
        O quadro sai desse instante. Episódio sem vídeo enviado ainda não tem de onde recortar.
      </small>
    </label>
  {/if}

  <BotaoPill variante="neutro" tipo="submit">Definir capa</BotaoPill>
</form>
