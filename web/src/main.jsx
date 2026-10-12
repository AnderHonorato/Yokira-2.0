import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ProvedorBiblioteca } from './ganchos/useBiblioteca.jsx';
import './estilos/base.css';

createRoot(document.getElementById('raiz')).render(
  <StrictMode>
    <BrowserRouter>
      <ProvedorBiblioteca><App /></ProvedorBiblioteca>
    </BrowserRouter>
  </StrictMode>,
);
