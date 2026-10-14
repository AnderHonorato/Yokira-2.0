<!-- Arquivo: src/lib/componentes/comum/seletor-de-tema.svelte -->
<!-- Escolha de tema. Sem JavaScript ainda funciona: os radios ficam num form normal
     e o botao do <noscript> envia. Com JavaScript, a troca e imediata. -->
<script lang="ts">
  import './seletor-de-tema.css';
  import { enhance } from '$app/forms';
  import { DESCRICAO_DO_TEMA, ROTULO_DO_TEMA, TEMAS, type Tema } from '$lib/validacoes/tema';

  export let atual: Tema;

  let forma: HTMLFormElement;

  function aplicar(escolhido: Tema) {
    atual = escolhido;
    // Troca antes de a resposta voltar: a preferencia e visual, e esperar o
    // round-trip apareceria como atraso exatamente na coisa que foi clicada.
    document.documentElement.dataset.tema = escolhido;
    forma.requestSubmit();
  }
</script>

<!-- `reset: false`: o enhance do SvelteKit limpa o formulario por padrao, e limpar
     um grupo de radios devolve a marcacao pro que veio do servidor — o tema mudava
     e o controle voltava sozinho pra opcao anterior. -->
<form
  bind:this={forma}
  class="tema-forma"
  method="POST"
  action="?/tema"
  use:enhance={() =>
    async ({ update }) =>
      update({ reset: false })}
>
  <fieldset class="tema-grupo">
    <legend class="tema-legenda">Tema</legend>

    {#each TEMAS as opcao (opcao)}
      <label class="tema-opcao" class:tema-opcao-ativa={atual === opcao}>
        <input
          type="radio"
          name="tema"
          value={opcao}
          checked={atual === opcao}
          on:change={() => aplicar(opcao)}
        />
        <span class="tema-texto">
          <span class="tema-nome">{ROTULO_DO_TEMA[opcao]}</span>
          <span class="tema-descricao">{DESCRICAO_DO_TEMA[opcao]}</span>
        </span>
      </label>
    {/each}
  </fieldset>

  <noscript>
    <button class="tema-salvar" type="submit">Salvar tema</button>
  </noscript>
</form>
