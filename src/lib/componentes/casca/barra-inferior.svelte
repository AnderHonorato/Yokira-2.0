<!-- Arquivo: src/lib/componentes/casca/barra-inferior.svelte -->
<!-- Cinco abas fixas no rodape do mobile (imagens 1 e 2). Some no desktop. -->
<script lang="ts">
  import './barra-inferior.css';
  import { page } from '$app/stores';
  import { ITENS_DA_BARRA_INFERIOR, estaAtivo } from './itens-de-navegacao';
  import Casa from '$visual/icones/casa.svelte';
  import GradeCatalogo from '$visual/icones/grade-catalogo.svelte';
  import NovidadesBrilho from '$visual/icones/novidades-brilho.svelte';
  import MarcadorLista from '$visual/icones/marcador-lista.svelte';
  import Engrenagem from '$visual/icones/engrenagem.svelte';

  const ICONES = {
    casa: Casa,
    'grade-catalogo': GradeCatalogo,
    'novidades-brilho': NovidadesBrilho,
    'marcador-lista': MarcadorLista,
    engrenagem: Engrenagem
  } as const;
</script>

<nav class="barra-inferior" aria-label="Navegação principal">
  {#each ITENS_DA_BARRA_INFERIOR as item (item.href)}
    {@const ativo = estaAtivo($page.url.pathname, item.href)}
    <a
      class="barra-inferior-item"
      class:barra-inferior-ativo={ativo}
      href={item.href}
      aria-current={ativo ? 'page' : undefined}
    >
      <svelte:component this={ICONES[item.icone]} tamanho={22} />
      <span class="barra-inferior-rotulo">{item.rotulo}</span>
    </a>
  {/each}
</nav>
