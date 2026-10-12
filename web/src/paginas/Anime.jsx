import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Play, Plus, Check, Heart, Star, Lock, CheckCircle2 } from 'lucide-react';
import { useApi } from '../ganchos/useApi.js';
import { useBiblioteca } from '../ganchos/useBiblioteca.jsx';
import { useAvisos } from '../ganchos/useAvisos.jsx';
import { capa } from '../util/api.js';
import { DIAS, ROTULO_STATUS, ROTULO_TEMPORADA, dataCurta, milhar } from '../util/formatos.js';
import CartaoPoster from '../componentes/CartaoPoster.jsx';
import Comentarios from '../componentes/Comentarios.jsx';
import { Carregando, Erro } from '../componentes/Estado.jsx';
import './Anime.css';

const ABAS = [['geral', 'Visão geral'], ['episodios', 'Episódios'], ['personagens', 'Personagens'], ['comunidade', 'Comunidade']];

function ListaEpisodios({ anime }) {
  const bib = useBiblioteca();
  const [todos, setTodos] = useState(false);
  const visiveis = todos ? anime.episodios : anime.episodios.slice(0, 12);
  return (
    <>
      <ol className="eps">
        {visiveis.map((ep) => {
          const visto = bib.assistido(anime.slug, ep.numero);
          const conteudo = (
            <>
              <span className="ep-miniatura">
                <img src={capa(anime.slug, 'ep', ep.numero)} alt="" loading="lazy" />
                {ep.disponivel ? <Play size={18} fill="currentColor" /> : <Lock size={16} />}
              </span>
              <span className="ep-info">
                <small>Episódio {ep.numero}{visto && <><CheckCircle2 size={13} /> assistido</>}</small>
                <strong>{ep.titulo}</strong>
                <small>{ep.disponivel ? `${ep.duracao} min` : 'Ainda não lançado'}</small>
              </span>
            </>
          );
          return (
            <li key={ep.numero} className={`ep ${visto ? 'ep-visto' : ''}`}>
              {ep.disponivel ? <Link to={`/assistir/${anime.slug}/${ep.numero}`} className="ep-link">{conteudo}</Link> : <div className="ep-link ep-bloqueado">{conteudo}</div>}
            </li>
          );
        })}
      </ol>
      {anime.episodios.length > 12 && !todos && (
        <button className="btn btn-contorno eps-mais" onClick={() => setTodos(true)}>Mostrar todos os {anime.episodios.length} episódios</button>
      )}
    </>
  );
}

export default function Anime() {
  const { slug } = useParams();
  const { dados: anime, erro, carregando } = useApi(`/animes/${slug}`);
  const [aba, setAba] = useState('geral');
  const [sinopseAberta, setSinopseAberta] = useState(false);
  const bib = useBiblioteca();
  const avisar = useAvisos();
  const [explosao, setExplosao] = useState(0);

  if (carregando) return <Carregando />;
  if (erro) return <Erro mensagem={erro} />;

  const disponiveis = anime.episodios.filter((e) => e.disponivel).length;
  const progresso = bib.progresso[anime.slug];
  const naLista = bib.naLista(anime.slug);
  const favorito = bib.favorito(anime.slug);
  const ficha = [
    ['Formato', anime.formato], ['Status', ROTULO_STATUS[anime.status]], ['Episódios', `${disponiveis} de ${anime.totalEpisodios}`],
    ['Duração', `${anime.duracaoEpisodio} min`], ['Estreia', dataCurta(anime.dataEstreia)],
    ['Temporada', `${ROTULO_TEMPORADA[anime.temporada]} ${anime.ano}`], ['Estúdio', anime.estudio],
    ['Classificação', anime.classificacao === 'L' ? 'Livre' : `${anime.classificacao} anos`],
    ['Áudio', anime.dublado ? 'Legendado e dublado' : 'Legendado'],
    ...(anime.diaExibicao !== null ? [['Exibição', `${DIAS[anime.diaExibicao]}, ${anime.horario}`]] : []),
  ];

  return (
    <div className="pagina">
      <section className="anime-capa">
        <img className="anime-banner" src={capa(anime.slug, 'banner')} alt="" />
        <div className="casca anime-cabecalho">
          <img className="anime-poster" src={capa(anime.slug)} alt={`Capa de ${anime.titulo}`} width="400" height="600" />
          <div className="anime-titulos">
            <nav className="trilha" aria-label="Você está em"><Link to="/">Início</Link> / <Link to="/acervo">Acervo</Link> / <span>{anime.titulo}</span></nav>
            <h1 className="anime-titulo">{anime.titulo}</h1>
            <p className="anime-original">{anime.tituloOriginal}</p>
            <div className="anime-meta">
              {anime.nota && <span className="chip"><Star size={13} fill="currentColor" className="nota" />{anime.nota}</span>}
              <span className="chip">{anime.ano}</span><span className="chip">{anime.formato}</span>
              {anime.generos.map((g) => <span key={g} className="chip">{g}</span>)}
            </div>
            <div className="anime-botoes">
              {disponiveis > 0
                ? <Link className="btn btn-primario" to={`/assistir/${anime.slug}/${progresso?.numero ?? 1}`}><Play size={16} fill="currentColor" />{progresso ? `Continuar ep. ${progresso.numero}` : 'Assistir agora'}</Link>
                : <span className="btn btn-contorno">Estreia em {dataCurta(anime.dataEstreia)}</span>}
              <button className={`btn btn-contorno ${naLista ? 'btn-ativo' : ''}`} onClick={() => { bib.alternarLista(anime); avisar(naLista ? 'Removido da sua lista' : 'Adicionado à sua lista'); }}><span key={String(naLista)} className={naLista ? 'icone-carimbo' : ''}>{naLista ? <Check size={16} /> : <Plus size={16} />}</span>{naLista ? 'Na sua lista' : 'Adicionar à lista'}</button>
              <button className={`btn btn-contorno btn-icone ${favorito ? 'btn-ativo' : ''}`} onClick={() => { bib.alternarFavorito(anime); if (!favorito) setExplosao((n) => n + 1); }} aria-pressed={favorito} aria-label={favorito ? 'Remover dos favoritos' : 'Favoritar'}><span className="favorito-alvo"><Heart size={17} fill={favorito ? 'currentColor' : 'none'} className={favorito ? 'coracao-pulso' : ''} />{explosao > 0 && <span className="explosao" key={explosao} aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ '--a': `${i * 45}deg` }} />)}</span>}</span></button>
            </div>
          </div>
        </div>
      </section>

      <div className="abas" role="tablist">
        <div className="casca abas-linha">
          {ABAS.map(([id, rotulo]) => (
            <button key={id} role="tab" aria-selected={aba === id} className="aba" onClick={() => setAba(id)}>
              {rotulo}{id === 'episodios' && <span className="aba-conta">{disponiveis}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="casca anime-corpo">
        <div className="anime-principal">
          {aba === 'geral' && (
            <>
              <h2 className="anime-h2">Sobre a história</h2>
              <p className={`anime-sinopse ${sinopseAberta ? 'aberta' : ''}`}>{anime.sinopse}</p>
              <h2 className="anime-h2">Episódios recentes</h2>
              <ListaEpisodios anime={{ ...anime, episodios: anime.episodios.filter((e) => e.disponivel).slice(-4).reverse() }} />
              <button className="secao-link" onClick={() => setAba('episodios')}>Ver todos os episódios</button>
              <h2 className="anime-h2">Personagens principais</h2>
              <Personagens lista={anime.personagens.filter((p) => p.principal)} />
            </>
          )}
          {aba === 'episodios' && <><h2 className="anime-h2">Episódios · {disponiveis} de {anime.totalEpisodios} lançados</h2><ListaEpisodios anime={anime} /></>}
          {aba === 'personagens' && <><h2 className="anime-h2">Elenco</h2><Personagens lista={anime.personagens} /></>}
          {aba === 'comunidade' && <Comentarios slug={anime.slug} />}
        </div>

        <aside className="anime-lateral">
          <div className="caixa">
            <h2 className="caixa-titulo">Pontuação</h2>
            <p className="pontuacao">{anime.nota ?? '—'}<small>/10</small></p>
            <p className="caixa-sub">{milhar(anime.favoritos)} pessoas favoritaram</p>
          </div>
          <div className="caixa">
            <h2 className="caixa-titulo">Ficha técnica</h2>
            <dl className="ficha">{ficha.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          </div>
        </aside>
      </div>

      {anime.relacionados.length > 0 && (
        <div className="casca secao">
          <h2 className="secao-titulo" style={{ marginBottom: 16 }}>Você também pode gostar</h2>
          <div className="grade-posters">{anime.relacionados.map((a) => <CartaoPoster key={a.slug} anime={a} />)}</div>
        </div>
      )}
    </div>
  );
}

function Personagens({ lista }) {
  return (
    <ul className="personagens">
      {lista.map((p) => (
        <li key={p.nome} className="personagem">
          <span className="personagem-avatar" aria-hidden="true">{p.nome.split(' ').map((x) => x[0]).join('')}</span>
          <span><strong>{p.nome}</strong><small>{p.papel} · voz de {p.dublador}</small><small className="personagem-desc">{p.descricao}</small></span>
        </li>
      ))}
    </ul>
  );
}
