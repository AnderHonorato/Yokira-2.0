import {sql} from 'drizzle-orm';
import {equipeAtiva,loteAtomico,type Db,type Usuario} from './permissoes';
import {ErroApi,identificador,texto} from './validacao';

type MensagemModeracao={id:string;salaId:string;autorId:string;nome:string;corpo:string;oculto:boolean;criadoEm:number};
export async function listarMensagensSalasAdmin(db:Db,usuario:Usuario,busca=''):Promise<{mensagens:MensagemModeracao[]}> {
 if(usuario.suspenso||!['moderador','administrador'].includes(usuario.papel))throw new ErroApi('Acesso à moderação indisponível.',403);
 const [autorizado]=await db.all(sql`select 1 where ${equipeAtiva(usuario.id)}`);
 if(!autorizado)throw new ErroApi('Permissão de moderação revogada.',403);
 const termo=busca.trim().slice(0,100);
 const mensagens=await db.all<MensagemModeracao>(sql`select msg.id,msg.sala_id salaId,msg.autor_id autorId,
 case when instr(u.nome,'@')>0 then 'Membro Yokira' else u.nome end nome,msg.corpo,msg.oculto,msg.criado_em criadoEm
 from sala_mensagens msg join usuarios u on u.id=msg.autor_id where ${equipeAtiva(usuario.id)}
 and (${termo}='' or instr(lower(msg.corpo),lower(${termo}))>0 or msg.sala_id=${termo}) order by msg.criado_em desc,msg.id desc limit 60`);
 return {mensagens:mensagens.map(m=>({...m,oculto:!!m.oculto}))};
}
export async function moderarMensagemSala(db:Db,usuario:Usuario,p:Record<string,unknown>) {
 if(usuario.suspenso||!['moderador','administrador'].includes(usuario.papel))throw new ErroApi('Acesso à moderação indisponível.',403);
 const id=identificador(p.id),motivo=texto(p.motivo,'Motivo',8,500);
 if(typeof p.oculto!=='boolean')throw new ErroApi('Informe se a mensagem deve ser ocultada.');
 const editar=p.corpo!==undefined,corpo=editar?texto(p.corpo,'Mensagem',1,1000):null;
 if(editar&&usuario.papel!=='administrador')throw new ErroApi('Somente administradores podem editar mensagens.',403);
 const [resultado]=await loteAtomico(db,[
  sql`update sala_mensagens set oculto=${p.oculto?1:0},corpo=coalesce(${corpo},corpo) where id=${id} and ${equipeAtiva(usuario.id,editar)} returning id`,
  sql`insert into registros_moderacao(id,autor_id,acao,alvo_tipo,alvo_id,motivo,criado_em)
   select ${crypto.randomUUID()},${usuario.id},${editar?'editar-mensagem-sala':p.oculto?'ocultar-mensagem-sala':'restaurar-mensagem-sala'},'mensagem-sala',${id},${motivo},${Date.now()} where changes()>0`
 ]);
 if(!resultado.results.length)throw new ErroApi('Mensagem não encontrada ou permissão revogada.',403);
 return {ok:true};
}
