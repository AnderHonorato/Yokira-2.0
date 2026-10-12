import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { ProvedorBiblioteca } from './ganchos/useBiblioteca.jsx';
import { ProvedorSessao } from './ganchos/useSessao.jsx';
import { ProvedorAvisos } from './ganchos/useAvisos.jsx';
import './estilos/base.css';

// No modo demo (página estática publicada) as rotas usam # no endereço
const Roteador = import.meta.env.MODE === 'demo' ? HashRouter : BrowserRouter;

createRoot(document.getElementById('raiz')).render(
  <StrictMode>
    <Roteador>
      <ProvedorAvisos>
        <ProvedorSessao>
          <ProvedorBiblioteca><App /></ProvedorBiblioteca>
        </ProvedorSessao>
      </ProvedorAvisos>
    </Roteador>
  </StrictMode>,
);
