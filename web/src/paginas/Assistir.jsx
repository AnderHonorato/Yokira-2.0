import { useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Check, CheckCircle2 } from 'lucide-react';
import { useApi } from '../ganchos/useApi.js';
import { useBiblioteca } from '../ganchos/useBiblioteca.jsx';
import { capa } from '../util/api.js';
import Player from '../componentes/Player.jsx';
import Comentarios from '../componentes/Comentarios.jsx';
import { Carregando, Erro } from '../componentes/Estado.jsx';
import './Assistir.css';

export default function Assistir() {
  const { slug, numero } = useParams();
  const navegar = useNavigate();
  const { dados, erro, carregando } = useApi(`/animes/${slug}/episodios/${numero}`);
  const bib = useBiblioteca();
  const ultimoSalvo = useRef(0);
  const listaRef = useRef(null);

  // Salva o progresso no máximo a cada 5 segundos
  const aoProgresso = useCallback((segundos, duracao) => {
    if (!dados || Math.abs(segundos - ultimoSalvo.current) < 5) return;
    ultimoSalvo.current = segundos;
    bib.salvarProgresso(dados.anime, dados.episodio.numero, segundos, duracao);
    if (duracao && segundos / duracao > 0.9) bib.marcarAssistido(slug, dados.episodio.numero);
  }, [dados, bib, slug]);

  useEffect(() => { ultimoSalvo.current = 0; listaRef.current?.querySelector('[aria-current]')?.scrollIntoView({ block: 'nearest' }); }, [dados]);

  if (carregando) return <Carregando />;
  if (erro) return <Erro mensagem={erro} />;

  const { anime, episodio, anterior, proximo } = dados;
  const progresso = bib.progresso[slug];
  const inicio = progresso?.numero === episodio.numero ? progresso.segundos : 0;
  const irPara = (n) => navegar(`/assistir/${slug}/${n}`);
  const naLista = bib.naLista(slug);

  return (
    <div className="pagina casca assistir">
      <div className="assistir-grade">
        <div className="assistir-principal">
          <Player key={episodio.numero} src={episodio.urlVideo} poster={capa(slug, 'ep', episodio.numero)} inicio={inicio}
            aoProgresso={aoProgresso} proximo={proximo ? () => irPara(proximo) : null}
            aoTerminar={() => { bib.marcarAssistido(slug, episodio.numero); if (proximo) irPara(proximo); }} />

          <div className="assistir-info">
            <div>
              <Link to={`/anime/${slug}`} className="assistir-anime">{anime.titulo}</Link>
              <h1 className="assistir-titulo">Episódio {episodio.numero} · {episodio.titulo}</h1>
              <p className="assistir-meta">{episodio.duracao} min · {anime.formato} · {anime.dublado ? 'Legendado e dublado' : 'Legendado'}</p>
            </div>
            <div className="assistir-acoes">
              <button className="btn btn-contorno" disabled={!anterior} onClick={() => irPara(anterior)}><ChevronLeft size={16} />Anterior</button>
              <button className="btn btn-primario" disabled={!proximo} onClick={() => irPara(proximo)}>Próximo<ChevronRight size={16} /></button>
              <button className={`btn btn-contorno btn-icone ${naLista ? 'btn-ativo' : ''}`} onClick={() => bib.alternarLista(anime)} aria-label={naLista ? 'Remover da lista' : 'Adicionar à lista'}>{naLista ? <Check size={17} /> : <Plus size={17} />}</button>
            </div>
          </div>
          <p className="assistir-dica">Atalhos: espaço pausa, ← → pulam 10s, F tela cheia, M silencia.</p>
          <Comentarios slug={slug} />
        </div>

        <aside className="assistir-lista">
          <h2 className="assistir-lista-titulo">Episódios <small>{anime.episodiosDisponiveis} de {anime.totalEpisodios}</small></h2>
          <ol ref={listaRef}>
            {anime.episodios.map((ep) => {
              const atual = ep.numero === episodio.numero;
              const visto = bib.assistido(slug, ep.numero);
              return (
                <li key={ep.numero}>
                  {ep.disponivel ? (
                    <Link to={`/assistir/${slug}/${ep.numero}`} className="assistir-ep" aria-current={atual ? 'true' : undefined}>
                      <img src={capa(slug, 'ep', ep.numero)} alt="" loading="lazy" />
                      <span><small>Ep. {ep.numero}{visto && <CheckCircle2 size={12} />}</small><strong>{ep.titulo}</strong></span>
                    </Link>
                  ) : (
                    <div className="assistir-ep assistir-ep-bloq"><span className="assistir-ep-num">{ep.numero}</span><span><small>Em breve</small><strong>{ep.titulo}</strong></span></div>
                  )}
                </li>
              );
            })}
          </ol>
        </aside>
      </div>
    </div>
  );
}
