import React from 'react';
import { createRoot } from 'react-dom/client';
import Portal from '../app/portal';
import '../app/globals.css';

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
