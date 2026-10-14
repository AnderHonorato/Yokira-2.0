<!-- Arquivo: src/lib/componentes/casca/cabecalho.svelte -->
<!-- Cabecalho das tres telas: logo a esquerda, navegacao, e a direita busca/painel/avatar. -->
<!-- No mobile a navegacao cai pra linha de baixo (imagens 1 e 2); no desktop fica na mesma linha. -->
<script lang="ts">
  import './cabecalho.css';
  import LogoYokira from '$visual/marca/logo-yokira.svelte';
  import Lupa from '$visual/icones/lupa.svelte';
  import Perfil from '$visual/icones/perfil.svelte';
  import Coroa from '$visual/icones/coroa.svelte';
  import NavegacaoPrincipal from './navegacao-principal.svelte';
  import type { UsuarioDaSessao } from '$servidor/autenticacao/sessao';

  export let usuario: UsuarioDaSessao | null = null;
  export let podeAcessarPainel = false;
</script>

<header class="cabecalho">
  <div class="cabecalho-faixa">
    <a class="cabecalho-logo" href="/" aria-label="Yōkira Animes — página inicial">
      <LogoYokira />
    </a>

    <div class="cabecalho-acoes">
      <a class="cabecalho-botao-icone" href="/buscar" aria-label="Buscar títulos">
        <Lupa tamanho={20} />
      </a>

      <!-- Sem este atalho o painel so era alcancavel digitando /admin na barra de
           endereco, e no celular nem isso era pratico. -->
      {#if podeAcessarPainel}
        <a class="cabecalho-painel" href="/admin" aria-label="Painel administrativo">
          <Coroa tamanho={18} />
          <span class="cabecalho-painel-rotulo">Painel</span>
        </a>
      {/if}

      <a
        class="cabecalho-avatar"
        href={usuario ? '/configuracoes' : '/entrar'}
        aria-label={usuario ? `Conta de ${usuario.nome}` : 'Entrar na conta'}
      >
        <Perfil tamanho={18} />
      </a>

      {#if !usuario}
        <a class="cabecalho-assinar" href="/entrar">Assinar e Logar</a>
      {/if}
    </div>

    <!-- Uma unica instancia da navegacao. Antes havia duas (uma escondida por
         media query), o que duplicava links no DOM e confundia leitor de tela. -->
    <div class="cabecalho-navegacao">
      <NavegacaoPrincipal />
    </div>
  </div>
</header>
