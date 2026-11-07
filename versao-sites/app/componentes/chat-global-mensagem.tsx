'use client';
import type { MensagemChat } from '../../lib/chat';
import CartaoPerfil, { AvatarComunidade } from './cartao-perfil';
import { Icone } from './icones';

type Props = { mensagem: MensagemChat; usuarioId?: string; ativo: boolean; entrando: boolean; bloqueado: boolean; navegar: (pagina: string, params?: Record<string, string>) => void; entrarSala: () => void; imagemCarregada: () => void };
export default function ChatGlobalMensagem({ mensagem: m, usuarioId, ativo, entrando, bloqueado, navegar, entrarSala, imagemCarregada }: Props) {
 const sala = m.sala, indisponivel = sala && (sala.encerrada || (!sala.participante && (sala.trancada || sala.participantes >= sala.capacidade)));
 const status = sala?.encerrada ? 'Sala encerrada' : sala?.trancada ? 'Sala trancada' : sala && sala.participantes >= sala.capacidade ? 'Sala lotada' : 'Convite para assistir junto';
 return <article className={'chat-global-mensagem' + (m.autor.id === usuarioId ? ' chat-global-propria' : '')}>
  <div className="chat-global-meta"><CartaoPerfil pessoa={m.autor} usuarioId={usuarioId} navegar={navegar}><span className="chat-global-autor"><AvatarComunidade nome={m.autor.nome} avatar={m.autor.avatar} pequeno/><strong>{m.autor.nome}</strong></span></CartaoPerfil><time dateTime={new Date(m.criadoEm).toISOString()}>{new Date(m.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time></div>
  {m.corpo && <p className="chat-global-corpo">{m.corpo}</p>}
  {m.imagem && /^\/api\/comunidade\/imagens\/[a-zA-Z0-9-]+$/.test(m.imagem) && <img className="chat-global-foto" src={m.imagem} alt={`Foto compartilhada por ${m.autor.nome}`} loading="lazy" onLoad={imagemCarregada}/>}
  {sala && <div className="chat-global-sala"><div><Icone nome="play" tamanho={17}/><span><strong>{sala.titulo}</strong><small>{status}</small></span></div><p>{sala.participantes}/{sala.capacidade} participantes</p><button type="button" disabled={!ativo || !!indisponivel || bloqueado} onClick={entrarSala}>{entrando ? 'Entrando…' : indisponivel ? status : ativo ? (sala.participante ? 'Abrir sala' : 'Entrar na sala') : 'Entre na conta para participar'}<Icone nome="seta" tamanho={14}/></button></div>}
 </article>;
}
