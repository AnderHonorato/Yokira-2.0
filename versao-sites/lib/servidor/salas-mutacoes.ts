import { sql } from 'drizzle-orm';
import type { Db, Usuario } from './permissoes';
import { ErroApi, identificador, inteiro, texto } from './validacao';
import { acesso, ativoSocial, donoAtivo, donoSala, episodioSalaPublico, executarSala, limiteSala } from './salas-base';
import { obterEpisodiosPublicos } from './temporadas';

export async function criarSala(db:Db,usuario:Usuario,p:Record<string,unknown>,origem?:string) {
 const tituloId=identificador(p.tituloId),episodioId=identificador(p.episodioId);
 if(!['dupla','grupo'].includes(String(p.modo)))throw new ErroApi('Escolha dupla ou grupo.');
 if(!(await obterEpisodiosPublicos(db,tituloId,origem)).episodios.some(e=>e.id===episodioId))throw new ErroApi('Episódio indisponível.',404);
 const id=crypto.randomUUID(),agora=Date.now(),convite=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
 const permitido=sql`${ativoSocial(usuario.id)} and (select count(*) from salas where dono_id=${usuario.id} and encerrada=0)<5`;
 const resultados=await executarSala(db,usuario,[
  limiteSala(usuario.id,'criar',10,3600000,permitido),
  sql`insert into salas(id,dono_id,titulo_id,episodio_id,modo,convite,atualizado_em,criado_em)
   select ${id},${usuario.id},${tituloId},${episodioId},${String(p.modo)},${convite},${agora},${agora} where changes()>0 and ${permitido}
   and exists(select 1 from (select ${tituloId} titulo_id,${episodioId} episodio_id) s where ${episodioSalaPublico()}) returning id`,
  sql`insert into sala_membros(sala_id,usuario_id,entrou_em) select ${id},${usuario.id},${agora} where changes()>0 returning sala_id`
 ]);
 if(!resultados[2].results.length)throw new ErroApi('Não foi possível criar a sala.',409);
 return {salaId:id,convite};
}
export async function entrarSalaPeloChat(db:Db,usuario:Usuario,p:Record<string,unknown>) {
 const mensagemId=identificador(p.mensagemId);
 const [sala]=await db.all<{convite:string}>(sql`select s.convite from chat_mensagens msg join salas s on s.id=msg.sala_id
  where msg.id=${mensagemId} and ${conviteChatVisivel(usuario.id,mensagemId)}`);
 if(!sala)throw new ErroApi('Convite do chat indisponível.',404);
 return entrarSala(db,usuario,{convite:sala.convite},mensagemId);
}
function conviteChatVisivel(usuarioId:string,mensagemId:string) {
 return sql`exists(select 1 from chat_mensagens convite join usuarios autor on autor.id=convite.autor_id
  where convite.id=${mensagemId} and convite.sala_id=s.id and convite.autor_id=s.dono_id and convite.oculto=0 and autor.suspenso=0
  and not exists(select 1 from bloqueios_sociais b where (b.autor_id=${usuarioId} and b.alvo_id=autor.id) or (b.alvo_id=${usuarioId} and b.autor_id=autor.id)))`;
}
export async function entrarSala(db:Db,usuario:Usuario,p:Record<string,unknown>,mensagemId?:string) {
 const convite=texto(p.convite,'Convite',64,64);
 if(!/^[a-f0-9]{64}$/.test(convite))throw new ErroApi('Convite inválido.');
 const permitido=sql`exists(select 1 from salas s where s.convite=${convite} and s.encerrada=0 and ${ativoSocial(usuario.id)} and ${donoAtivo()} and ${episodioSalaPublico()}
 and (s.trancada=0 or exists(select 1 from sala_membros m where m.sala_id=s.id and m.usuario_id=${usuario.id} and m.ativo=1 and m.expulso=0))
 and ${mensagemId?conviteChatVisivel(usuario.id,mensagemId):sql`1=1`}
 and not exists(select 1 from sala_membros m where m.sala_id=s.id and m.usuario_id=${usuario.id} and m.expulso=1)
 and not exists(select 1 from sala_membros m join bloqueios_sociais b on ((b.autor_id=${usuario.id} and b.alvo_id=m.usuario_id) or (b.alvo_id=${usuario.id} and b.autor_id=m.usuario_id)) where m.sala_id=s.id and m.ativo=1))`;
 const resultado=await executarSala(db,usuario,[limiteSala(usuario.id,'entrar',30,60000,ativoSocial(usuario.id)),
  sql`insert into sala_membros(sala_id,usuario_id,ativo,expulso,entrou_em)
   select s.id,${usuario.id},1,0,${Date.now()} from salas s where s.convite=${convite} and changes()>0 and ${permitido}
   and ((select count(*) from sala_membros m where m.sala_id=s.id and m.ativo=1)<case s.modo when 'dupla' then 2 else 12 end
    or exists(select 1 from sala_membros m where m.sala_id=s.id and m.usuario_id=${usuario.id} and m.ativo=1))
   on conflict(sala_id,usuario_id) do update set ativo=1,entrou_em=excluded.entrou_em where sala_membros.expulso=0 returning sala_id`
 ]);
 return {salaId:(resultado[1].results[0] as {sala_id:string}).sala_id};
}
export async function mensagemSala(db:Db,usuario:Usuario,p:Record<string,unknown>) {
 const salaId=identificador(p.salaId),corpo=texto(p.corpo,'Mensagem',1,1000),id=crypto.randomUUID();
 const permitido=sql`exists(select 1 from salas s where s.id=${salaId} and ${acesso(usuario.id)})`;
 await executarSala(db,usuario,[limiteSala(usuario.id,'mensagem',12,10000,permitido),
  sql`insert into sala_mensagens(id,sala_id,autor_id,corpo,criado_em) select ${id},${salaId},${usuario.id},${corpo},${Date.now()} where changes()>0 and ${permitido} returning id`,
  sql`delete from sala_mensagens where sala_id=${salaId} and ${permitido} and id not in(select id from sala_mensagens where sala_id=${salaId} order by criado_em desc,id desc limit 500)`]);
 return {ok:true};
}
export async function controlarSala(db:Db,usuario:Usuario,p:Record<string,unknown>) {
 const salaId=identificador(p.salaId);
 const permitido=sql`exists(select 1 from salas s where s.id=${salaId} and ${donoSala(usuario.id)})`;
 if(p.acao==='sala-sincronizar') {
  if(typeof p.pausado!=='boolean'||typeof p.posicao!=='number'||!Number.isFinite(p.posicao)||p.posicao<0||p.posicao>36000)throw new ErroApi('Estado do player inválido.');
  const revisao=inteiro(p.revisao,'Revisão',0,Number.MAX_SAFE_INTEGER);
  await executarSala(db,usuario,[limiteSala(usuario.id,'sincronizar',30,10000,permitido),
   sql`update salas as s set pausado=${p.pausado?1:0},posicao=${p.posicao},revisao=revisao+1,atualizado_em=${Date.now()}
    where id=${salaId} and changes()>0 and ${donoSala(usuario.id)} and ${episodioSalaPublico()} and s.revisao=${revisao} returning revisao`]);
 } else if(p.acao==='sala-trancar') {
  if(typeof p.trancada!=='boolean')throw new ErroApi('Informe se a sala deve ficar trancada.');
  await executarSala(db,usuario,[limiteSala(usuario.id,'trancar',20,60000,permitido),
   sql`update salas as s set trancada=${p.trancada?1:0},atualizado_em=${Date.now()}
    where id=${salaId} and changes()>0 and ${donoSala(usuario.id)} returning id`]);
 } else if(p.acao==='sala-encerrar') {
  await executarSala(db,usuario,[limiteSala(usuario.id,'encerrar',20,60000,permitido),
   sql`update salas as s set encerrada=1,pausado=1,revisao=revisao+1,atualizado_em=${Date.now()} where id=${salaId} and changes()>0 and ${donoSala(usuario.id)} returning id`]);
 } else if(p.acao==='sala-expulsar') {
  const alvo=identificador(p.usuarioId);
  if(alvo===usuario.id)throw new ErroApi('Encerre a sala para sair como dono.');
  await executarSala(db,usuario,[limiteSala(usuario.id,'expulsar',30,60000,permitido),
   sql`update sala_membros set ativo=0,expulso=1 where sala_id=${salaId} and usuario_id=${alvo} and changes()>0 and ${permitido} returning usuario_id`]);
 } else if(p.acao==='sala-sair') {
  const membro=sql`exists(select 1 from salas s join sala_membros m on m.sala_id=s.id where s.id=${salaId} and s.encerrada=0 and s.dono_id<>${usuario.id}
   and m.usuario_id=${usuario.id} and m.ativo=1 and m.expulso=0 and ${ativoSocial(usuario.id)})`;
  await executarSala(db,usuario,[limiteSala(usuario.id,'sair',30,60000,membro),
   sql`update sala_membros set ativo=0 where sala_id=${salaId} and usuario_id=${usuario.id} and changes()>0 and ${membro} returning usuario_id`]);
 } else throw new ErroApi('Ação de sala desconhecida.');
 return {ok:true};
}
