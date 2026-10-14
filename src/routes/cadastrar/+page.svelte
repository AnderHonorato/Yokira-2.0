<!-- Arquivo: src/routes/cadastrar/+page.svelte -->
<script lang="ts">
  import '../formulario-conta.css';
  import BotaoPill from '$componentes/comum/botao-pill.svelte';
  import LogoYokira from '$visual/marca/logo-yokira.svelte';
  import { TAMANHO_MINIMO_DA_SENHA } from '$lib/validacoes/conta';

  export let form;
</script>

<svelte:head><title>Criar conta — Yōkira Animes</title></svelte:head>

<div class="conta">
  <div class="conta-marca"><LogoYokira /></div>
  <h1 class="conta-titulo">Criar conta</h1>

  <form class="conta-forma" method="POST">
    <label class="conta-campo">
      <span>Nome</span>
      <input type="text" name="nome" value={form?.nome ?? ''} required autocomplete="name" />
    </label>

    <label class="conta-campo">
      <span>E-mail</span>
      <input type="email" name="email" value={form?.email ?? ''} required autocomplete="email" />
    </label>

    <label class="conta-campo">
      <span>Senha</span>
      <input type="password" name="senha" required autocomplete="new-password" />
      <small>Mínimo de {TAMANHO_MINIMO_DA_SENHA} caracteres, misturando letras e números.</small>
    </label>

    {#if form?.mensagem}
      <p class="conta-erro" role="alert">{form.mensagem}</p>
    {/if}

    <BotaoPill variante="marca" tipo="submit">Criar conta</BotaoPill>
  </form>

  <p class="conta-alternativa">Já tem conta? <a href="/entrar">Entrar</a></p>
</div>
