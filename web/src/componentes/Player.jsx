import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw, RotateCw, SkipForward, PictureInPicture2 } from 'lucide-react';
import { tempo } from '../util/formatos.js';
import './Player.css';

// Player próprio sobre <video>: atalhos de teclado, retomada, velocidade, PiP e "próximo episódio"
export default function Player({ src, poster, inicio = 0, aoProgresso, aoTerminar, proximo }) {
  const video = useRef(null);
  const caixa = useRef(null);
  const [tocando, setTocando] = useState(false);
  const [atual, setAtual] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [carregado, setCarregado] = useState(0);
  const [mudo, setMudo] = useState(false);
  const [volume, setVolume] = useState(1);
  const [velocidade, setVelocidade] = useState(1);
  const [cheia, setCheia] = useState(false);
  const [controles, setControles] = useState(true);
  const [erro, setErro] = useState(false);
  const ocultar = useRef(null);

  const v = () => video.current;
  const alternar = () => (v().paused ? v().play().catch(() => {}) : v().pause());
  const pular = (s) => { v().currentTime = Math.min(Math.max(0, v().currentTime + s), v().duration || 0); };
  const telaCheia = () => (document.fullscreenElement ? document.exitFullscreen() : caixa.current.requestFullscreen?.());

  const mostrarControles = () => {
    setControles(true);
    clearTimeout(ocultar.current);
    ocultar.current = setTimeout(() => !v()?.paused && setControles(false), 2600);
  };

  useEffect(() => { setErro(false); }, [src]);
  useEffect(() => {
    const mudou = () => setCheia(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', mudou);
    return () => document.removeEventListener('fullscreenchange', mudou);
  }, []);

  useEffect(() => {
    const teclas = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      const acoes = { ' ': alternar, k: alternar, ArrowRight: () => pular(10), l: () => pular(10), ArrowLeft: () => pular(-10), j: () => pular(-10),
        f: telaCheia, m: () => { v().muted = !v().muted; } };
      if (acoes[e.key]) { e.preventDefault(); acoes[e.key](); mostrarControles(); }
    };
    addEventListener('keydown', teclas);
    return () => removeEventListener('keydown', teclas);
  });

  return (
    <div ref={caixa} className={`player ${controles ? '' : 'player-limpo'}`} onMouseMove={mostrarControles} onTouchStart={mostrarControles}>
      <video
        ref={video} src={src} poster={poster} playsInline preload="metadata" onClick={alternar}
        onLoadedMetadata={(e) => { setDuracao(e.target.duration); if (inicio > 5 && inicio < e.target.duration - 10) e.target.currentTime = inicio; }}
        onTimeUpdate={(e) => { setAtual(e.target.currentTime); aoProgresso?.(e.target.currentTime, e.target.duration); }}
        onProgress={(e) => { const b = e.target.buffered; if (b.length) setCarregado(b.end(b.length - 1)); }}
        onPlay={() => { setTocando(true); mostrarControles(); }} onPause={() => { setTocando(false); setControles(true); }}
        onVolumeChange={(e) => { setMudo(e.target.muted); setVolume(e.target.volume); }}
        onEnded={aoTerminar} onError={() => setErro(true)}
      />

      {erro && <div className="player-aviso">Não foi possível carregar o vídeo. Confira a URL do episódio no servidor.</div>}
      {!tocando && !erro && <button className="player-grande" onClick={alternar} aria-label="Reproduzir"><Play size={34} fill="currentColor" /></button>}

      <div className="player-barra">
        <div className="player-tempo-linha">
          <i style={{ width: `${duracao ? (carregado / duracao) * 100 : 0}%` }} className="player-buffer" />
          <input type="range" min="0" max={duracao || 0} step="0.1" value={atual} aria-label="Posição do vídeo"
            onChange={(e) => { v().currentTime = Number(e.target.value); }} style={{ '--p': `${duracao ? (atual / duracao) * 100 : 0}%` }} />
        </div>
        <div className="player-controles">
          <button onClick={alternar} aria-label={tocando ? 'Pausar' : 'Reproduzir'}>{tocando ? <Pause size={20} /> : <Play size={20} />}</button>
          <button onClick={() => pular(-10)} aria-label="Voltar 10 segundos"><RotateCcw size={18} /></button>
          <button onClick={() => pular(10)} aria-label="Avançar 10 segundos"><RotateCw size={18} /></button>
          <div className="player-volume">
            <button onClick={() => { v().muted = !v().muted; }} aria-label={mudo ? 'Ativar som' : 'Silenciar'}>{mudo || volume === 0 ? <VolumeX size={19} /> : <Volume2 size={19} />}</button>
            <input type="range" min="0" max="1" step="0.05" value={mudo ? 0 : volume} aria-label="Volume"
              onChange={(e) => { v().volume = Number(e.target.value); v().muted = Number(e.target.value) === 0; }} />
          </div>
          <span className="player-hora">{tempo(atual)} / {tempo(duracao)}</span>
          <span className="player-espaco" />
          <select value={velocidade} onChange={(e) => { const x = Number(e.target.value); v().playbackRate = x; setVelocidade(x); }} aria-label="Velocidade">
            {[0.75, 1, 1.25, 1.5, 2].map((x) => <option key={x} value={x}>{x}x</option>)}
          </select>
          {document.pictureInPictureEnabled && <button onClick={() => v().requestPictureInPicture?.().catch(() => {})} aria-label="Miniplayer"><PictureInPicture2 size={18} /></button>}
          {proximo && <button onClick={proximo} aria-label="Próximo episódio"><SkipForward size={19} /></button>}
          <button onClick={telaCheia} aria-label={cheia ? 'Sair da tela cheia' : 'Tela cheia'}>{cheia ? <Minimize size={18} /> : <Maximize size={18} />}</button>
        </div>
      </div>
    </div>
  );
}
