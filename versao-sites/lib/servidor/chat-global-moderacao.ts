import {sql} from 'drizzle-orm';
import {equipeAtiva,loteAtomico,type Db,type Usuario} from './permissoes';
import {ErroApi,identificador,texto} from './validacao';
async function equipe(db:Db,usuario:Usuario){
 const [ativa]=await db.all(sql`select 1 where ${equipeAtiva(usuario.id)}`);
 if(usuario.suspenso||!ativa)throw new ErroApi('Acesso à moderação indisponível.',403);
}
export async function listarChatModeracao(db:Db,usuario:Usuario,busca=''){
 await equipe(db,usuario);const termo=texto(busca,'Busca',0,100);
 const mensagens=await db.all(sql`select c.id,c.autor_id autorId,u.nome,c.corpo,c.imagem_id imagemId,c.sala_id salaId,c.oculto,c.criado_em criadoEm
  from chat_mensagens c join usuarios u on u.id=c.autor_id where ${equipeAtiva(usuario.id)}
  and (${termo}='' or instr(lower(c.corpo),lower(${termo}))>0 or instr(lower(u.nome),lower(${termo}))>0)
  order by c.criado_em desc,c.id desc limit 100`);
 return {mensagens};
}
export async function moderarChatGlobal(db:Db,usuario:Usuario,p:Record<string,unknown>){
 await equipe(db,usuario);
 if(Object.keys(p).some(k=>!['acao','id','oculto','motivo','corpo'].includes(k)))throw new ErroApi('Campo de moderação não permitido.');
 const id=identificador(p.id),motivo=texto(p.motivo,'Motivo',8,500);
 if(typeof p.oculto!=='boolean')throw new ErroApi('Informe a visibilidade da mensagem.');
 const editar=p.corpo!==undefined,corpo=editar?texto(p.corpo,'Mensagem',0,1000):null;
 const [alterada]=await loteAtomico(db,[
  sql`update chat_mensagens set oculto=${p.oculto?1:0},corpo=coalesce(${corpo},corpo) where id=${id}
   and ${equipeAtiva(usuario.id,editar)} and (${editar?1:0}=0 or length(trim(${corpo}))>0 or imagem_id is not null or sala_id is not null) returning id`,
  sql`insert into registros_moderacao(id,autor_id,acao,alvo_tipo,alvo_id,motivo,criado_em)
   select ${crypto.randomUUID()},${usuario.id},${editar?'editar-chat-global':p.oculto?'ocultar-chat-global':'restaurar-chat-global'},'chat-global',${id},${motivo},${Date.now()} where changes()>0`
 ]);
 if(!alterada.results.length)throw new ErroApi('Mensagem não encontrada ou permissão indisponível.',403);
 return {ok:true};
}
