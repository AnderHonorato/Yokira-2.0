<!-- Arquivo: src/routes/verificar-email/+page.svelte -->
<script lang="ts">
  import '../formulario-conta.css';
  import BotaoPill from '$componentes/comum/botao-pill.svelte';
  import LogoYokira from '$visual/marca/logo-yokira.svelte';

  export let data;
</script>

<svelte:head><title>Confirmar e-mail — Yōkira Animes</title></svelte:head>

<div class="conta">
  <div class="conta-marca"><LogoYokira /></div>
  <h1 class="conta-titulo">Confirmação de e-mail</h1>

  <div class="conta-forma">
    {#if data.verificado}
      <p class="conta-aviso" role="status">E-mail confirmado. Sua conta está completa.</p>
      <BotaoPill variante="marca" href="/">Ir para a home</BotaoPill>
    {:else}
      <p class="conta-erro" role="alert">
        Este link expirou ou já foi usado. Peça um novo nas configurações da conta.
      </p>
      <BotaoPill variante="marca" href="/configuracoes">Abrir configurações</BotaoPill>
    {/if}
  </div>
</div>
