<!-- Arquivo: src/routes/recuperar-senha/+page.svelte -->
<script lang="ts">
  import '../formulario-conta.css';
  import BotaoPill from '$componentes/comum/botao-pill.svelte';
  import LogoYokira from '$visual/marca/logo-yokira.svelte';

  export let form;
</script>

<svelte:head><title>Recuperar senha — Yōkira Animes</title></svelte:head>

<div class="conta">
  <div class="conta-marca"><LogoYokira /></div>
  <h1 class="conta-titulo">Recuperar senha</h1>

  {#if form?.enviado}
    <div class="conta-forma">
      <p class="conta-aviso" role="status">
        Se existir uma conta com <strong>{form.email}</strong>, o link para criar uma nova senha já
        está a caminho.
      </p>
      <p class="conta-dica">O link vale por 1 hora e só pode ser usado uma vez.</p>
    </div>
  {:else}
    <form class="conta-forma" method="POST">
      <label class="conta-campo">
        <span>E-mail</span>
        <input type="email" name="email" value={form?.email ?? ''} required autocomplete="email" />
        <small>Enviamos um link para você criar uma nova senha.</small>
      </label>

      {#if form?.mensagem}
        <p class="conta-erro" role="alert">{form.mensagem}</p>
      {/if}

      <BotaoPill variante="marca" tipo="submit">Enviar link</BotaoPill>
    </form>
  {/if}

  <p class="conta-alternativa">Lembrou a senha? <a href="/entrar">Entrar</a></p>
</div>
