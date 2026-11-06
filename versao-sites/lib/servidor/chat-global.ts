import {sql} from 'drizzle-orm';
import {obterAcervo} from './catalogo-administrativo';
import type {Db,Usuario} from './permissoes';
import {relacaoSql,nomeSeguro} from './social-base';
import type {MensagemChat,PainelChat} from '../chat';
import {episodioSalaPublico} from './salas-base';

type Linha={id:string;corpo:string;criadoEm:number;autorId:string;nome:string;handle:string;nivel:number;avatar:string;relacao:MensagemChat['autor']['relacao'];imagemId:string|null;salaId:string|null;tituloId:string|null;participantes:number;trancada:number;encerrada:number;modo:string;disponivel:number;participante:number};
/** Cada leitura substitui a janela pública: ocultações e alterações de sala aparecem no próximo ciclo. */
export async function listarChatGlobal(db:Db,usuario:Usuario|null):Promise<PainelChat>{
 const id=usuario?.id||'';
 const linhas=await db.all<Linha>(sql`select c.id,c.corpo,c.criado_em criadoEm,u.id autorId,u.nome,p.handle,
   cast(max(0,u.xp)/100 as integer)+1 nivel,p.avatar,${relacaoSql(id)},c.imagem_id imagemId,
   s.id salaId,s.titulo_id tituloId,s.trancada,s.encerrada,s.modo,${episodioSalaPublico()} disponivel,
   exists(select 1 from sala_membros meu where meu.sala_id=s.id and meu.usuario_id=${id} and meu.ativo=1 and meu.expulso=0) participante,
   (select count(*) from sala_membros m join usuarios membro on membro.id=m.usuario_id where m.sala_id=s.id and m.ativo=1 and membro.suspenso=0) participantes
   from chat_mensagens c join usuarios u on u.id=c.autor_id join perfis_sociais p on p.usuario_id=u.id
   left join amizades a on a.usuario_a=min(${id},u.id) and a.usuario_b=max(${id},u.id)
   left join salas s on s.id=c.sala_id and s.dono_id=u.id
   where c.oculto=0 and u.suspenso=0 
   and not exists(select 1 from bloqueios_sociais b where (b.autor_id=${id} and b.alvo_id=u.id) or (b.autor_id=u.id and b.alvo_id=${id}))
   order by c.criado_em desc,c.id desc limit 60`);
 const catalogo=linhas.some(c=>c.salaId)?(await obterAcervo(db)).catalogo:[];
 const mensagens:MensagemChat[]=linhas.reverse().map(c=>{
  const titulo=catalogo.find(t=>t.id===c.tituloId);
  return {id:c.id,corpo:c.corpo,criadoEm:c.criadoEm,autor:{id:c.autorId,nome:nomeSeguro(c.nome),handle:c.handle,nivel:c.nivel,relacao:c.relacao,avatar:c.avatar},
   imagem:c.imagemId?`/api/comunidade/imagens/${c.imagemId}`:null,
   sala:c.salaId?{id:c.salaId,titulo:titulo?.nome||'Título indisponível',participantes:c.participantes,capacidade:c.modo==='dupla'?2:12,trancada:!!c.trancada,encerrada:!!c.encerrada||!titulo||!c.disponivel,participante:!!c.participante}:null};
 });
 return {mensagens,servidorEm:Date.now()};
}
