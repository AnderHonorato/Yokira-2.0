'use client';

import { useEffect, useState } from 'react';
import type { AparenciaGlobal, IntensidadeCenario } from '../../lib/servidor/aparencia';
import './aparencia-admin.css';
import PreviaCelebracao from './previa-celebracao';

const cenarios = [
  ['01-sakura-luar', 'Sakura ao luar'], ['02-metropole-chuva', 'Metrópole sob chuva'],
  ['03-ilhas-celestes', 'Ilhas celestes'], ['04-expresso-crepusculo', 'Expresso do crepúsculo'],
  ['05-templo-de-neve', 'Templo de neve'], ['06-areias-do-destino', 'Areias do destino'],
  ['07-floresta-espiritos', 'Floresta dos espíritos'], ['08-observatorio-astral', 'Observatório astral'],
  ['09-palacio-submerso', 'Palácio submerso'], ['10-dragoes-do-amanhecer', 'Dragões do amanhecer']
] as const;
const intensidades: { valor: IntensidadeCenario; nome: string; descricao: string }[] = [
  { valor: 'suave', nome: 'Suave', descricao: 'Luz e movimento discretos.' },
  { valor: 'equilibrado', nome: 'Equilibrado', descricao: 'Luz e movimento moderados.' },
  { valor: 'intenso', nome: 'Intenso', descricao: 'Luz e movimento mais presentes.' }
];
type Props = { notificar: (mensagem: string) => void; recarregar: () => void | Promise<void> };
type Resposta = { aparencia?: AparenciaGlobal; erro?: string; error?: string } & Partial<AparenciaGlobal>;

export default function AparenciaAdmin({ notificar, recarregar }: Props) {
  const [atual, setAtual] = useState<AparenciaGlobal | null>(null);
  const [cenario, setCenario] = useState(0);
  const [intensidade, setIntensidade] = useState<IntensidadeCenario>('intenso');
  const [motivo, setMotivo] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    const controle = new AbortController();
    async function carregar() {
      setCarregando(true); setErro('');
      try {
        const resposta = await fetch('/api/yokira?acao=aparencia', { signal: controle.signal, cache: 'no-store' });
        const resultado = await resposta.json() as Resposta;
        if (!resposta.ok) throw new Error(resultado.erro || resultado.error || 'Não foi possível carregar a aparência.');
        const configuracao = resultado.aparencia ?? resultado as AparenciaGlobal;
        setAtual(configuracao); setCenario(configuracao.cenario); setIntensidade(configuracao.intensidade);
      } catch (falha) {
        if (!controle.signal.aborted) setErro(falha instanceof Error ? falha.message : 'Não foi possível carregar a aparência.');
      } finally { if (!controle.signal.aborted) setCarregando(false); }
    }
    void carregar(); return () => controle.abort();
  }, [tentativa]);

  async function salvar() {
    if (!atual || salvando || motivo.trim().length < 3) return;
    setSalvando(true); setErro(''); setSucesso('');
    try {
      const resposta = await fetch('/api/yokira', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'salvar-aparencia', cenario, intensidade, motivo: motivo.trim() }) });
      const resultado = await resposta.json() as Resposta;
      if (!resposta.ok || !resultado.aparencia) throw new Error(resultado.erro || resultado.error || 'Não foi possível aplicar a aparência.');
      setAtual(resultado.aparencia); setMotivo('');
      setSucesso('Aparência aplicada a todo o site e registrada na auditoria.');
      window.dispatchEvent(new CustomEvent('yokira:aparencia', { detail: resultado.aparencia }));
      notificar('Aparência aplicada para todos os visitantes.');
      await recarregar();
    } catch (falha) { setErro(falha instanceof Error ? falha.message : 'Não foi possível aplicar a aparência.'); }
    finally { setSalvando(false); }
  }

  return <section className="aparencia-admin" aria-labelledby="aparencia-titulo" aria-busy={carregando || salvando}>
    <h2 id="aparencia-titulo">Aparência do site</h2>
    <p className="administracao-ajuda">Somente administradores escolhem o cenário e a intensidade. Ao aplicar, a mesma aparência será exibida para todos os visitantes.</p>
    {carregando && <p role="status">Carregando aparência…</p>}
    {erro && <div className="administracao-aviso" role="alert"><p>{erro}</p>{!atual && !carregando && <button className="button button-subtle" type="button" onClick={() => setTentativa(v => v + 1)}>Tentar novamente</button>}</div>}
    {sucesso && <p className="administracao-aviso" role="status">{sucesso}</p>}
    {atual && <form onSubmit={evento => { evento.preventDefault(); void salvar(); }}>
      <fieldset disabled={salvando} className="aparencia-cenarios"><legend>Cenário para todos</legend>
        <div className="aparencia-grade">{cenarios.map(([arquivo, nome], indice) => <label className="aparencia-opcao" key={arquivo} data-selecionado={cenario === indice}>
          <input type="radio" name="cenario-global" value={indice} checked={cenario === indice} onChange={() => { setCenario(indice); setSucesso(''); }}/>
          <span className="aparencia-miniatura" aria-hidden="true" style={{ backgroundImage: `url('/arte/cenarios/${arquivo}-320.webp')` }}/>
          <span className="aparencia-nome">{nome}<small>{cenario === indice ? 'Selecionado' : 'Selecionar cenário'}</small></span>
        </label>)}</div>
      </fieldset>
      <fieldset className="aparencia-intensidades" disabled={salvando}><legend>Intensidade das animações</legend>
        <div>{intensidades.map(item => <label className="aparencia-intensidade" key={item.valor}>
          <input type="radio" name="intensidade-global" checked={intensidade === item.valor} onChange={() => { setIntensidade(item.valor); setSucesso(''); }}/>
          <span><strong>{item.nome}</strong><small>{item.descricao}</small></span>
        </label>)}</div>
        <p className="administracao-ajuda">O site respeita a preferência de reduzir movimento de cada dispositivo.</p>
      </fieldset>
      <label htmlFor="aparencia-motivo">Motivo da alteração<textarea id="aparencia-motivo" value={motivo} onChange={evento => setMotivo(evento.target.value)} minLength={3} maxLength={500} required disabled={salvando} aria-describedby="aparencia-ajuda-motivo"/></label>
      <p id="aparencia-ajuda-motivo" className="administracao-ajuda">De 3 a 500 caracteres. O motivo ficará na auditoria.</p>
      <div className="aparencia-rodape"><span>{atual.atualizadoEm > 0 ? `Aplicado em ${new Date(atual.atualizadoEm).toLocaleString('pt-BR')}` : 'Aparência inicial do site'}</span>
        <button className="button button-primary" disabled={salvando || motivo.trim().length < 3}>{salvando ? 'Aplicando…' : 'Aplicar para todos'}</button>
      </div>
    </form>}
    <PreviaCelebracao/>
  </section>;
}
