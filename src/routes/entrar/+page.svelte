<!-- Arquivo: src/routes/entrar/+page.svelte -->
<script lang="ts">
  import '../formulario-conta.css';
  import BotaoPill from '$componentes/comum/botao-pill.svelte';
  import LogoYokira from '$visual/marca/logo-yokira.svelte';

  export let data;
  export let form;
</script>

<svelte:head><title>Entrar — Yōkira Animes</title></svelte:head>

<div class="conta">
  <div class="conta-marca"><LogoYokira /></div>
  <h1 class="conta-titulo">Entrar na conta</h1>

  {#if data.senhaRedefinida}
    <p class="conta-aviso" role="status">
      Senha alterada. As outras sessões foram encerradas — entre com a nova senha.
    </p>
  {/if}

  <form class="conta-forma" method="POST">
    <label class="conta-campo">
      <span>E-mail</span>
      <input type="email" name="email" value={form?.email ?? ''} required autocomplete="email" />
    </label>

    <label class="conta-campo">
      <span>Senha</span>
      <input type="password" name="senha" required autocomplete="current-password" />
    </label>

    {#if form?.mensagem}
      <p class="conta-erro" role="alert">{form.mensagem}</p>
    {/if}

    <BotaoPill variante="marca" tipo="submit">Entrar</BotaoPill>
  </form>

  <p class="conta-alternativa">
    <a href="/recuperar-senha">Esqueci minha senha</a>
  </p>

  <p class="conta-alternativa">
    Ainda não tem conta? <a href="/cadastrar">Criar conta</a>
  </p>
</div>
