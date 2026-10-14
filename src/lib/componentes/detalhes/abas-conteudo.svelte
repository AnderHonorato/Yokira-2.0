<!-- Arquivo: src/lib/componentes/detalhes/abas-conteudo.svelte -->
<!-- Abas "Episodios | Sobre | Personagens | Recomendacoes" com sublinhado roxo na ativa. -->
<script lang="ts">
  import './abas-conteudo.css';
  import { createEventDispatcher } from 'svelte';

  export let abas: { chave: string; rotulo: string }[];
  export let ativa: string;

  const despachar = createEventDispatcher<{ trocar: string }>();

  function selecionar(chave: string) {
    ativa = chave;
    despachar('trocar', chave);
  }
</script>

<div class="abas rolagem-oculta" role="tablist">
  {#each abas as aba (aba.chave)}
    <button
      class="aba"
      class:aba-ativa={ativa === aba.chave}
      type="button"
      role="tab"
      aria-selected={ativa === aba.chave}
      on:click={() => selecionar(aba.chave)}
    >
      {aba.rotulo}
    </button>
  {/each}
</div>
