import React from 'react';
import { createRoot } from 'react-dom/client';
import Portal from '../app/portal';
import { catalogo, editoriais, demonstracaoVideo } from '../lib/catalogo';
import { CENARIOS_HERO } from '../app/componentes/cenarios-hero';
import '../app/globals.css';

// A hospedagem GitHub Pages usa /Yokira-2.0/, enquanto a aplicação Sites
// oficial e as demais hospedagens servem os recursos na raiz /.
// Normalizar aqui preserva todos os componentes e URLs da aplicação principal.
const basePublica = window.location.pathname.startsWith('/Yokira-2.0/')
  ? '/Yokira-2.0'
  : '';
if (basePublica) {
  const corrigirRecurso = (endereco: string): string =>
    endereco.startsWith('/') ? basePublica + endereco : endereco;

  for (const titulo of catalogo) {
    titulo.poster = corrigirRecurso(titulo.poster);
    titulo.capa = corrigirRecurso(titulo.capa);
  }
  for (const editorial of editoriais) {
    editorial.imagem = corrigirRecurso(editorial.imagem);
  }
  demonstracaoVideo.poster = corrigirRecurso(demonstracaoVideo.poster);
  demonstracaoVideo.url = corrigirRecurso(demonstracaoVideo.url);

  // A sequência é um array em tempo de execução. Só a cópia pública
  // deste bundle usa o prefixo; nenhuma arte é regravada no banco.
  const cenarios = CENARIOS_HERO as unknown as string[];
  cenarios.forEach((endereco, indice) => {
    cenarios[indice] = corrigirRecurso(endereco);
  });

  // A navegação SPA continua dentro da rota do repositório no Pages.
  const original = window.history.pushState.bind(window.history);
  window.history.pushState = (dados, titulo, url) => {
    const destino = typeof url === 'string' && (url === '/' || url.startsWith('/?'))
      ? basePublica + url
      : url;
    return original(dados, titulo, destino);
  };
}

// Modo de demonstração. O banco, os usuários e as operações de escrita não
// são simulados com dados falsos. O site oficial usa Cloudflare D1.
const buscarOriginal = window.fetch.bind(window);
window.fetch = async (recurso, opcoes) => {
  const caminho = recurso instanceof Request ? recurso.url : String(recurso);
  const url = new URL(caminho, window.location.href);
  if (url.origin === window.location.origin && url.pathname === '/api/yokira') {
    const metodo = (opcoes?.method || (recurso instanceof Request ? recurso.method : 'GET')).toUpperCase();
    if (metodo !== 'GET') {
      return Response.json(
        { erro: 'Prévia visual: para salvar dados, abra a versão com backend.' },
        { status: 503 }
      );
    }
    const acao = url.searchParams.get('acao') || 'estado';
    if (acao === 'publico') {
      return Response.json({
        estatisticas: { membros: 0, atividades: 0 },
        membros: [],
        publicacoes: []
      });
    }
    return Response.json({ erro: 'Prévia visual sem autenticação ou banco conectado.' }, { status: 401 });
  }
  return buscarOriginal(recurso, opcoes);
};

const raiz = document.getElementById('root');
if (!raiz) throw new Error('A raiz da prévia do Yokira não foi encontrada.');

createRoot(raiz).render(
  <React.StrictMode>
    <Portal parametrosIniciais={window.location.search.replace(/^\?/, '')} />
  </React.StrictMode>
);
