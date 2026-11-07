import {sql} from 'drizzle-orm';
import {loteAtomico,type Db,type Usuario} from './permissoes';
import {ativoSocial} from './social-base';
import {episodioSalaPublico} from './salas-base';
import {ErroApi,identificador} from './validacao';
/** Só registra o episódio publicado da sessão; compartilhar esse dado continua sendo opt-in. */
export async function registrarAtividadeVideo(db:Db,usuario:Usuario,p:Record<string,unknown>){
 const episodioId=identificador(p.episodioId),agora=Date.now();
 const [limite,gravada]=await loteAtomico(db,[
  sql`insert into limites(usuario_id,janela,quantidade) select ${usuario.id},${`atividade:${Math.floor(agora/60000)}`},1 where ${ativoSocial(usuario.id)}
   on conflict(usuario_id,janela) do update set quantidade=quantidade+1 where quantidade<20 returning quantidade`,
  sql`insert into atividade_perfis(usuario_id,titulo_id,episodio_id,atualizado_em)
   select ${usuario.id},s.titulo_id,s.episodio_id,${agora} from (select titulo_id,id episodio_id from episodios where id=${episodioId}) s
   where changes()>0 and ${ativoSocial(usuario.id)} and ${episodioSalaPublico()}
   on conflict(usuario_id) do update set titulo_id=excluded.titulo_id,episodio_id=excluded.episodio_id,atualizado_em=max(atividade_perfis.atualizado_em+1,excluded.atualizado_em) returning usuario_id`
 ]);
 if(!gravada.results.length)throw new ErroApi(limite.results.length?'Episódio indisponível.':'Não foi possível atualizar sua atividade.',limite.results.length?404:403);
 return {ok:true};
}
