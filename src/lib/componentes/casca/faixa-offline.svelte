<!-- Arquivo: src/lib/componentes/casca/faixa-offline.svelte -->
<!-- Faixa discreta do modo offline degradado: o que ja baixou continua navegavel. -->
<script lang="ts">
  import './faixa-offline.css';
  import { onMount } from 'svelte';
  import { estaOffline } from '$cliente/navegacao-instantanea';

  let offline = false;

  onMount(() => {
    offline = estaOffline();
    const marcar = () => (offline = estaOffline());
    window.addEventListener('online', marcar);
    window.addEventListener('offline', marcar);
    return () => {
      window.removeEventListener('online', marcar);
      window.removeEventListener('offline', marcar);
    };
  });
</script>

{#if offline}
  <p class="faixa-offline" role="status">Você está sem conexão. Mostrando o que já foi baixado.</p>
{/if}
