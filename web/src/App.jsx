import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Topo from './componentes/Topo.jsx';
import Rodape from './componentes/Rodape.jsx';
import { Carregando } from './componentes/Estado.jsx';
import Inicio from './paginas/Inicio.jsx';
import Chat from './componentes/Chat.jsx';

// Páginas carregadas sob demanda para o primeiro acesso ser leve
const Acervo = lazy(() => import('./paginas/Acervo.jsx'));
const Anime = lazy(() => import('./paginas/Anime.jsx'));
const Assistir = lazy(() => import('./paginas/Assistir.jsx'));
const Agenda = lazy(() => import('./paginas/Agenda.jsx'));
const Top100 = lazy(() => import('./paginas/Top100.jsx'));
const MinhaLista = lazy(() => import('./paginas/MinhaLista.jsx'));
const Noticias = lazy(() => import('./paginas/Noticias.jsx'));
const Noticia = lazy(() => import('./paginas/Noticia.jsx'));
const Comunidade = lazy(() => import('./paginas/Comunidade.jsx'));
const Ranking = lazy(() => import('./paginas/Ranking.jsx'));
const Perfil = lazy(() => import('./paginas/Perfil.jsx'));
const Forum = lazy(() => import('./paginas/Forum.jsx'));
const Topico = lazy(() => import('./paginas/Topico.jsx'));
const AnimeDaSemana = lazy(() => import('./paginas/AnimeDaSemana.jsx'));
const Admin = lazy(() => import('./paginas/Admin.jsx'));
const NaoEncontrado = lazy(() => import('./paginas/NaoEncontrado.jsx'));

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <>
      <Topo />
      <main>
        <Suspense fallback={<Carregando />}>
          {/* key muda a cada página: dispara a animação de entrada */}
          <div className="transicao-pagina" key={pathname}>
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
            <Route path="/comunidade" element={<Comunidade />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/perfil/:id" element={<Perfil />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/:id" element={<Topico />} />
            <Route path="/anime-da-semana" element={<AnimeDaSemana />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NaoEncontrado />} />
          </Routes>
          </div>
        </Suspense>
      </main>
      <Rodape />
      <Chat />
    </>
  );
}
