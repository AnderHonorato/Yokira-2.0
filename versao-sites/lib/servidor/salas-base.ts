import { sql, type SQL } from 'drizzle-orm';
import { catalogo } from '../catalogo';
import { type Db, type Usuario, loteAtomico } from './permissoes';
import { ErroApi } from './validacao';
import { ativoSocial } from './social-base';

export { ativoSocial };
const tiposCatalogo=JSON.stringify(Object.fromEntries(catalogo.map(t=>[t.id,t.tipo])));
/** O alias s sempre é a sala examinada pela própria consulta SQL. */
export function episodioSalaPublico(): SQL {
 return sql`exists (select 1 from episodios e left join temporadas t on t.id=e.temporada_id and t.titulo_id=e.titulo_id
 where e.id=s.episodio_id and e.titulo_id=s.titulo_id and e.publicado=1 and e.arquivado=0 and e.video_url<>''
 and (e.estreia_em is null or e.estreia_em<=${Date.now()}) and (e.temporada_id is null or t.arquivado=0)
 and case coalesce((select json_extract(o.dados,'$.tipo') from sobreposicoes_conteudo o where o.tipo='titulo' and o.alvo_id=s.titulo_id),
 (select value from json_each(${tiposCatalogo}) where key=s.titulo_id)) when 'Filme' then e.temporada_id is null and e.numero=1
 when 'Série' then e.temporada_id is not null else 0 end)
 and not exists(select 1 from catalogo_disponibilidade d where d.titulo_id=s.titulo_id and d.oculto=1)
 and not exists(select 1 from sobreposicoes_conteudo o where o.tipo='titulo' and o.alvo_id=s.titulo_id and o.oculto=1)`;
}
export function donoSala(usuarioId:string):SQL {
 return sql`s.encerrada=0 and s.dono_id=${usuarioId} and ${ativoSocial(usuarioId)}
 and exists(select 1 from sala_membros m where m.sala_id=s.id and m.usuario_id=${usuarioId} and m.ativo=1 and m.expulso=0)`;
}
export function donoAtivo():SQL { return sql`exists(select 1 from usuarios u where u.id=s.dono_id and u.suspenso=0)`; }
export function acesso(usuarioId:string):SQL {
 return sql`${acessoSalaSemDono(usuarioId)} and ${donoAtivo()}`;
}
function acessoSalaSemDono(usuarioId:string):SQL {
 return sql`s.encerrada=0 and ${ativoSocial(usuarioId)} and ${episodioSalaPublico()}
 and exists(select 1 from sala_membros m where m.sala_id=s.id and m.usuario_id=${usuarioId} and m.ativo=1 and m.expulso=0)
 and not exists(select 1 from sala_membros b join bloqueios_sociais bs on
 ((bs.autor_id=${usuarioId} and bs.alvo_id=b.usuario_id) or (bs.alvo_id=${usuarioId} and bs.autor_id=b.usuario_id)) where b.sala_id=s.id and b.ativo=1)`;
}
export function limiteSala(usuarioId:string,acao:string,max:number,janelaMs:number,permitido:SQL):SQL {
 const janela=`sala:${acao}:${Math.floor(Date.now()/janelaMs)}`;
 return sql`insert into limites(usuario_id,janela,quantidade) select ${usuarioId},${janela},1 where ${permitido}
 on conflict(usuario_id,janela) do update set quantidade=quantidade+1 where quantidade<${max} returning quantidade`;
}
export async function executarSala(db:Db,usuario:Usuario,consultas:SQL[]) {
 if(usuario.suspenso)throw new ErroApi('Sua conta está suspensa.',403);
 const resultados=await loteAtomico(db,consultas);
 if(!resultados[0].results.length)throw new ErroApi('Acesso indisponível ou limite de ações atingido. Aguarde e atualize a sala.',403);
 if(!resultados[1]?.results.length)throw new ErroApi('Sala indisponível, lotada ou alterada. Atualize e tente novamente.',409);
 return resultados;
}
