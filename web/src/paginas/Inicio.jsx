import { Link } from 'react-router-dom';
import { CalendarDays, Trophy, Bookmark, LayoutGrid, Play } from 'lucide-react';
import { useApi } from '../ganchos/useApi.js';
import { useBiblioteca } from '../ganchos/useBiblioteca.jsx';
import { capa } from '../util/api.js';
import { dataCurta, diasAte } from '../util/formatos.js';
import Destaque from '../componentes/Destaque.jsx';
import PainelRanking from '../componentes/PainelRanking.jsx';
import CartaoPoster from '../componentes/CartaoPoster.jsx';
import LinhaRolavel from '../componentes/LinhaRolavel.jsx';
import Secao from '../componentes/Secao.jsx';
import { Carregando, Erro } from '../componentes/Estado.jsx';
import './Inicio.css';

const ATALHOS = [
  { para: '/agenda', Icone: CalendarDays, titulo: 'Agenda', texto: 'O que estreia em cada dia' },
  { para: '/top100', Icone: Trophy, titulo: 'Top 100', texto: 'Os mais bem avaliados' },
  { para: '/acervo', Icone: LayoutGrid, titulo: 'Acervo', texto: 'Filtre por gênero e ano' },
  { para: '/minha-lista', Icone: Bookmark, titulo: 'Minha lista', texto: 'Salvos e favoritos' },
];

function ContinuarAssistindo() {
  const { progresso } = useBiblioteca();
  const itens = Object.values(progresso).sort((a, b) => b.em - a.em).slice(0, 8);
  if (!itens.length) return null;
  return (
    <Secao titulo="Continuar assistindo" link="/minha-lista?aba=historico" rotuloLink="Histórico">
      <LinhaRolavel largura={280} rotulo="continuar assistindo">
        {itens.map((p) => (
          <Link key={p.slug} to={`/assistir/${p.slug}/${p.numero}`} className="continuar">
            <div className="continuar-capa">
              <img src={capa(p.slug, 'ep', p.numero)} alt="" loading="lazy" />
              <span className="continuar-play"><Play size={18} fill="currentColor" /></span>
              <i style={{ width: `${Math.min(100, (p.segundos / (p.duracao || 1)) * 100)}%` }} />
            </div>
            <strong>{p.titulo}</strong>
            <small>Episódio {p.numero}</small>
          </Link>
        ))}
      </LinhaRolavel>
    </Secao>
  );
}

export default function Inicio() {
  const { dados, erro, carregando } = useApi('/inicio');
  if (carregando) return <Carregando />;
  if (erro) return <Erro mensagem={erro} />;
  const { estatisticas: est } = dados;

  return (
    <div className="pagina casca inicio">
      <div className="inicio-topo">
        <Destaque itens={dados.destaques} />
        <div className="inicio-lateral">
          <PainelRanking ranking={dados.ranking} />
          <dl className="inicio-numeros">
            <div><dt>No ar</dt><dd>{est.noAr}</dd></div>
            <div><dt>Episódios na temporada</dt><dd>{est.episodiosTemporada}</dd></div>
            <div><dt>Títulos</dt><dd>{est.titulos}</dd></div>
          </dl>
        </div>
      </div>

      <nav className="atalhos" aria-label="Atalhos">
        {ATALHOS.map(({ para, Icone, titulo, texto }) => (
          <Link key={para} to={para} className="atalho"><span className="atalho-icone"><Icone size={18} /></span><span><strong>{titulo}</strong><small>{texto}</small></span></Link>
        ))}
      </nav>

      <ContinuarAssistindo />

      <Secao titulo="Em alta esta semana" link="/acervo?ordem=em-alta">
        <LinhaRolavel largura={300} rotulo="em alta">
          {dados.emAlta.map((a, i) => (
            <Link key={a.slug} to={`/anime/${a.slug}`} className="tendencia">
              <span className="tendencia-pos">{i + 1}</span>
              <img src={capa(a.slug)} alt="" loading="lazy" />
              <span className="tendencia-info"><strong>{a.titulo}</strong><small>{a.generos.slice(0, 2).join(', ')}</small><small>{a.formato} · {a.ano}</small></span>
            </Link>
          ))}
        </LinhaRolavel>
      </Secao>

      <Secao titulo="No ar nesta temporada" sub="Episódios novos toda semana" link="/acervo?status=no-ar">
        <div className="grade-posters">{dados.noAr.slice(0, 12).map((a) => <CartaoPoster key={a.slug} anime={a} />)}</div>
      </Secao>

      <Secao titulo="Mais bem avaliados" link="/top100" rotuloLink="Ver Top 100">
        <LinhaRolavel rotulo="mais bem avaliados">{dados.top.map((a, i) => <CartaoPoster key={a.slug} anime={a} posicao={i + 1} />)}</LinhaRolavel>
      </Secao>

      {dados.emBreve.length > 0 && (
        <Secao titulo="Próximas estreias" link="/acervo?status=em-breve">
          <div className="grade-posters">
            {dados.emBreve.map((a) => <CartaoPoster key={a.slug} anime={a} mostrarEstreia selo={`Em ${diasAte(a.dataEstreia)} dias`} />)}
          </div>
        </Secao>
      )}

      {dados.encerrando.length > 0 && (
        <Secao titulo="Reta final" sub="Faltam até 2 episódios para acabar">
          <div className="grade-posters">{dados.encerrando.map((a) => <CartaoPoster key={a.slug} anime={a} selo="Últimos eps" />)}</div>
        </Secao>
      )}

      <Secao titulo="Notícias" link="/noticias">
        <div className="noticias-grade">
          {dados.noticias.map((n) => (
            <Link key={n.slug} to={`/noticias/${n.slug}`} className="noticia-cartao">
              <img src={capa(n.animeSlug, 'ep', 1)} alt="" loading="lazy" />
              <span className="chip">{n.tag}</span>
              <strong>{n.titulo}</strong>
              <small>{dataCurta(n.data)}</small>
            </Link>
          ))}
        </div>
      </Secao>
    </div>
  );
}
