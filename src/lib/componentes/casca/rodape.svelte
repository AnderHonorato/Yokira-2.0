<!-- Arquivo: src/lib/componentes/casca/rodape.svelte -->
<!-- Rodape enxuto de desktop. No mobile a barra inferior ja cumpre esse papel. -->
<script lang="ts">
  import './rodape.css';
  import LogoYokira from '$visual/marca/logo-yokira.svelte';
</script>

<footer class="rodape">
  <div class="rodape-conteudo">
    <LogoYokira compacta />
    <nav class="rodape-links" aria-label="Rodapé">
      <a href="/catalogo">Catálogo</a>
      <a href="/generos">Gêneros</a>
      <a href="/configuracoes">Configurações</a>
    </nav>
    <p class="rodape-nota">
      Catálogo de demonstração com títulos fictícios. Nenhuma obra de terceiros é distribuída aqui.
    </p>
  </div>
</footer>
