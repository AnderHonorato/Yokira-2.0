import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Check } from 'lucide-react';
import { useApi } from '../ganchos/useApi.js';
import { useBiblioteca } from '../ganchos/useBiblioteca.jsx';
import { capa } from '../util/api.js';
import { DIAS_CURTOS, dataCurta } from '../util/formatos.js';
import { Carregando, Erro } from '../componentes/Estado.jsx';
import './Agenda.css';

export default function Agenda() {
  const { dados, erro, carregando } = useApi('/agenda');
  const [dia, setDia] = useState(0);
  const bib = useBiblioteca();
  if (carregando) return <Carregando />;
  if (erro) return <Erro mensagem={erro} />;
  const atual = dados[dia];

  return (
    <div className="pagina casca agenda">
      <h1 className="pagina-titulo">Agenda da semana</h1>
      <p className="secao-sub">Horários de Brasília. Toque em um dia para ver os lançamentos.</p>
      <div className="agenda-dias" role="tablist" aria-label="Dias da semana">
        {dados.map((d, i) => (
          <button key={d.data} role="tab" aria-selected={i === dia} className="agenda-dia" onClick={() => setDia(i)}>
            <small>{i === 0 ? 'Hoje' : DIAS_CURTOS[d.diaSemana]}</small>
            <strong>{dataCurta(d.data)}</strong>
            <span>{d.itens.length} {d.itens.length === 1 ? 'episódio' : 'episódios'}</span>
          </button>
        ))}
      </div>

      {atual.itens.length === 0 && <p className="vazio">Nenhum lançamento neste dia.</p>}
      <ol className="agenda-lista">
        {atual.itens.map((a) => {
          const naLista = bib.naLista(a.slug);
          return (
            <li key={a.slug} className="agenda-item">
              <time className="agenda-hora">{a.horario}</time>
              <Link to={`/anime/${a.slug}`} className="agenda-cartao">
                <img src={capa(a.slug)} alt="" loading="lazy" />
                <span className="agenda-info">
                  <strong>{a.titulo}</strong>
                  <small>Episódio {a.proximoEpisodio} de {a.totalEpisodios}</small>
                  <small>{a.generos.slice(0, 3).join(', ')}</small>
                </span>
              </Link>
              <button className={`btn btn-contorno btn-icone ${naLista ? 'btn-ativo' : ''}`} onClick={() => bib.alternarLista(a)} aria-label={naLista ? `Remover ${a.titulo} da lista` : `Adicionar ${a.titulo} à lista`}>
                {naLista ? <Check size={17} /> : <Plus size={17} />}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
