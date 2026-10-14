<!-- Arquivo: src/routes/redefinir-senha/+page.svelte -->
<script lang="ts">
  import '../formulario-conta.css';
  import BotaoPill from '$componentes/comum/botao-pill.svelte';
  import LogoYokira from '$visual/marca/logo-yokira.svelte';
  import { TAMANHO_MINIMO_DA_SENHA } from '$lib/validacoes/conta';

  export let data;
  export let form;
</script>

<svelte:head><title>Nova senha — Yōkira Animes</title></svelte:head>

<div class="conta">
  <div class="conta-marca"><LogoYokira /></div>
  <h1 class="conta-titulo">Escolher nova senha</h1>

  {#if data.linkValido}
    <form class="conta-forma" method="POST">
      <input type="hidden" name="token" value={data.token} />

      <label class="conta-campo">
        <span>Nova senha</span>
        <input type="password" name="senha" required autocomplete="new-password" />
        <small>
          Pelo menos {TAMANHO_MINIMO_DA_SENHA} caracteres, misturando letras e números.
        </small>
      </label>

      {#if form?.mensagem}
        <p class="conta-erro" role="alert">{form.mensagem}</p>
      {/if}

      <BotaoPill variante="marca" tipo="submit">Salvar nova senha</BotaoPill>
    </form>
  {:else}
    <div class="conta-forma">
      <p class="conta-erro" role="alert">
        Este link expirou ou já foi usado. Peça um novo para continuar.
      </p>
      <BotaoPill variante="marca" href="/recuperar-senha">Pedir novo link</BotaoPill>
    </div>
  {/if}

  <p class="conta-alternativa"><a href="/entrar">Voltar para entrar</a></p>
</div>
