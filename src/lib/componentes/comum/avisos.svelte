<!-- Arquivo: src/lib/componentes/comum/avisos.svelte -->
<!-- Pilha de avisos, fixa no canto. Fica na casca pra qualquer tela poder avisar
     sem montar nada — e pra o aviso sobreviver a navegacao de cliente. -->
<script lang="ts">
  import './avisos.css';
  import { flip } from 'svelte/animate';
  import { fly } from 'svelte/transition';
  import { avisos, dispensar } from '$cliente/avisos';
  import Verificado from '$visual/icones/verificado.svelte';
  import Fechar from '$visual/icones/fechar.svelte';
</script>

<!-- aria-live polite: anuncia sem interromper o que a pessoa esta lendo. -->
<div class="avisos" role="status" aria-live="polite">
  {#each $avisos as aviso (aviso.id)}
    <div
      class="aviso aviso-{aviso.tom}"
      animate:flip={{ duration: 200 }}
      in:fly={{ y: 12, duration: 220 }}
      out:fly={{ y: 8, duration: 160 }}
    >
      {#if aviso.tom === 'sucesso'}
        <span class="aviso-icone"><Verificado tamanho={16} /></span>
      {/if}
      <span class="aviso-texto">{aviso.texto}</span>
      <button
        class="aviso-fechar"
        type="button"
        aria-label="Dispensar aviso"
        on:click={() => dispensar(aviso.id)}
      >
        <Fechar tamanho={14} />
      </button>
    </div>
  {/each}
</div>
