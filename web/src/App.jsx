import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Topo from './componentes/Topo.jsx';
import Rodape from './componentes/Rodape.jsx';
import { Carregando } from './componentes/Estado.jsx';
import Inicio from './paginas/Inicio.jsx';

// Páginas carregadas sob demanda para o primeiro acesso ser leve
const Acervo = lazy(() => import('./paginas/Acervo.jsx'));
const Anime = lazy(() => import('./paginas/Anime.jsx'));
const Assistir = lazy(() => import('./paginas/Assistir.jsx'));
const Agenda = lazy(() => import('./paginas/Agenda.jsx'));
const Top100 = lazy(() => import('./paginas/Top100.jsx'));
const MinhaLista = lazy(() => import('./paginas/MinhaLista.jsx'));
const Noticias = lazy(() => import('./paginas/Noticias.jsx'));
const Noticia = lazy(() => import('./paginas/Noticia.jsx'));
const NaoEncontrado = lazy(() => import('./paginas/NaoEncontrado.jsx'));

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <>
      <Topo />
      <main>
        <Suspense fallback={<Carregando />}>
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/acervo" element={<Acervo />} />
            <Route path="/anime/:slug" element={<Anime />} />
            <Route path="/assistir/:slug/:numero" element={<Assistir />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/top100" element={<Top100 />} />
            <Route path="/minha-lista" element={<MinhaLista />} />
            <Route path="/noticias" element={<Noticias />} />
            <Route path="/noticias/:slug" element={<Noticia />} />
            <Route path="*" element={<NaoEncontrado />} />
          </Routes>
        </Suspense>
      </main>
      <Rodape />
    </>
  );
}
