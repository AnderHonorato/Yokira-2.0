<!-- Arquivo: src/lib/componentes/casca/tela-de-carregamento.svelte -->
<!-- So aparece no PRIMEIRO acesso, com barra de progresso real dos passos. Quem ja tem
     cache entra direto — mostrar loading pra quem ja baixou tudo seria mentira e atraso. -->
<script lang="ts">
  import './tela-de-carregamento.css';
  import { onMount } from 'svelte';
  import LogoYokira from '$visual/marca/logo-yokira.svelte';
  import { catalogoEmCache, executarPassos, passosPadrao } from '$cliente/precarregamento';

  let visivel = false;
  let porcentagem = 0;
  let rotulo = 'Preparando';

  onMount(async () => {
    const jaTemCache = await catalogoEmCache().catch(() => null);
    if (jaTemCache) return;

    visivel = true;
    await executarPassos(passosPadrao(), (valor, passo) => {
      porcentagem = valor;
      rotulo = passo;
    });
    visivel = false;
  });
</script>

{#if visivel}
  <div class="carregando" role="status" aria-live="polite">
    <div class="carregando-marca"><LogoYokira /></div>
    <div class="carregando-barra">
      <div class="carregando-preenchimento" style:width={`${porcentagem}%`}></div>
    </div>
    <p class="carregando-rotulo">{rotulo} — {porcentagem}%</p>
  </div>
{/if}
