<!-- Arquivo: src/lib/componentes/casca/navegacao-principal.svelte -->
<!-- Linha "Inicio · Catalogo · Novidades · Generos · Minha Lista" das tres telas. -->
<!-- Rola na horizontal no mobile porque em 360px os cinco itens nao cabem. -->
<script lang="ts">
  import './navegacao-principal.css';
  import { page } from '$app/stores';
  import { ITENS_DE_NAVEGACAO, estaAtivo } from './itens-de-navegacao';
</script>

<nav class="nav-principal rolagem-oculta" aria-label="Seções do catálogo">
  <ul class="nav-principal-lista">
    {#each ITENS_DE_NAVEGACAO as item (item.href)}
      <li>
        <a
          class="nav-principal-item"
          class:nav-principal-ativo={estaAtivo($page.url.pathname, item.href)}
          href={item.href}
          aria-current={estaAtivo($page.url.pathname, item.href) ? 'page' : undefined}
        >
          {item.rotulo}
        </a>
      </li>
    {/each}
  </ul>
</nav>
