<!-- Arquivo: src/lib/componentes/carregando/esqueleto-de-rota.svelte -->
<!-- Porta unica do carregamento em esqueleto: recebe o caminho de destino e mostra a
     estrutura que vai chegar nele. O par .ts ao lado decide qual; aqui so monta. -->
<script lang="ts">
  import { esqueletoDaRota } from './esqueleto-de-rota';
  import EsqueletoHome from './esqueleto-home.svelte';
  import EsqueletoGrade from './esqueleto-grade.svelte';
  import EsqueletoDetalhes from './esqueleto-detalhes.svelte';
  import EsqueletoPlayer from './esqueleto-player.svelte';
  import EsqueletoPainel from './esqueleto-painel.svelte';
  import EsqueletoGenerico from './esqueleto-generico.svelte';

  export let caminho: string;

  const POR_TIPO = {
    home: EsqueletoHome,
    grade: EsqueletoGrade,
    detalhes: EsqueletoDetalhes,
    player: EsqueletoPlayer,
    painel: EsqueletoPainel,
    generico: EsqueletoGenerico
  };

  $: componente = POR_TIPO[esqueletoDaRota(caminho)];
</script>

<div class="esqueleto-de-rota" role="status" aria-busy="true">
  <!-- O texto e o unico conteudo que o leitor de tela anuncia: as barras sao decorativas
       e cada uma ja sai com aria-hidden. -->
  <span class="apenas-leitor-de-tela">Carregando a página</span>
  <svelte:component this={componente} />
</div>
