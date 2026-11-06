import { sql } from 'drizzle-orm';
import type { SalaResumo, SalaDetalhe, MembroSala, MensagemSala } from '../salas';
import { loteAtomico,type Db,type Usuario } from './permissoes';
import { ErroApi, identificador } from './validacao';
import { acesso,ativoSocial,limiteSala } from './salas-base';
import { obterEpisodiosPublicos } from './temporadas';

type LinhaSala={id:string;titulo_id:string;episodio_id:string;dono_id:string;modo:'dupla'|'grupo';trancada:number;convite:string;pausado:number;posicao:number;revisao:number;atualizado_em:number;criado_em:number;participantes:number};
const resumo=(s:LinhaSala):SalaResumo=>({id:s.id,tituloId:s.titulo_id,episodioId:s.episodio_id,donoId:s.dono_id,modo:s.modo,participantes:s.participantes,trancada:!!s.trancada,criadoEm:s.criado_em});
export async function obterSalas(db:Db,usuario:Usuario):Promise<{salas:SalaResumo[]}> {
 if(usuario.suspenso)throw new ErroApi('Sua conta está suspensa.',403);
 await consumirLeitura(db,usuario.id,'listar',30,ativoSocial(usuario.id));
 const salas=await db.all<LinhaSala>(sql`select s.*,(select count(*) from sala_membros m where m.sala_id=s.id and m.ativo=1) participantes
 from salas s where ${acesso(usuario.id)} order by s.criado_em desc limit 30`);
 return {salas:salas.map(resumo)};
}
export async function obterSala(db:Db,usuario:Usuario,valor:unknown,origem?:string):Promise<SalaDetalhe> {
 const id=identificador(valor);
 if(usuario.suspenso)throw new ErroApi('Sua conta está suspensa.',403);
 await consumirLeitura(db,usuario.id,'ler',90,sql`exists(select 1 from salas s where s.id=${id} and ${acesso(usuario.id)})`);
 const [s]=await db.all<LinhaSala>(sql`select s.*,(select count(*) from sala_membros m where m.sala_id=s.id and m.ativo=1) participantes
 from salas s where s.id=${id} and ${acesso(usuario.id)}`);
 if(!s)throw new ErroApi('Sala não encontrada ou acesso indisponível.',404);
 const [membros,mensagens,conteudo]=await Promise.all([
  db.all<MembroSala>(sql`select m.usuario_id usuarioId,case when instr(u.nome,'@')>0 then 'Membro Yokira' else u.nome end nome,(m.usuario_id=s.dono_id) dono from sala_membros m join usuarios u on u.id=m.usuario_id
   join salas s on s.id=m.sala_id where s.id=${id} and m.ativo=1 and u.suspenso=0 and ${acesso(usuario.id)} order by m.entrou_em,m.usuario_id limit 12`),
  db.all<MensagemSala>(sql`select msg.id,msg.autor_id autorId,case when instr(u.nome,'@')>0 then 'Membro Yokira' else u.nome end nome,msg.corpo,msg.criado_em criadoEm from sala_mensagens msg join usuarios u on u.id=msg.autor_id
   join salas s on s.id=msg.sala_id where s.id=${id} and msg.oculto=0 and u.suspenso=0 and ${acesso(usuario.id)}
   and not exists(select 1 from bloqueios_sociais bs where (bs.autor_id=${usuario.id} and bs.alvo_id=msg.autor_id) or (bs.alvo_id=${usuario.id} and bs.autor_id=msg.autor_id))
   order by msg.criado_em desc,msg.id desc limit 80`),
  obterEpisodiosPublicos(db,s.titulo_id,origem)
 ]);
 const episodio=conteudo.episodios.find(e=>e.id===s.episodio_id);
 // Revalida após as consultas paralelas: expulsão, bloqueio e encerramento cancelam todo o DTO.
 const [ainda]=await db.all(sql`select 1 from salas s where s.id=${id} and ${acesso(usuario.id)}`);
 if(!episodio||!ainda)throw new ErroApi('Sala ou episódio indisponível.',404);
 return {...resumo(s),...(s.dono_id===usuario.id?{convite:s.convite}:{}),membros:membros.map(m=>({...m,dono:!!m.dono})),mensagens:mensagens.reverse(),
  estado:{pausado:!!s.pausado,posicao:s.posicao,revisao:s.revisao,atualizadoEm:s.atualizado_em,servidorEm:Date.now()},
  episodio:{titulo:episodio.titulo,poster:episodio.poster,fontes:episodio.fontes||[]}};
}

async function consumirLeitura(db:Db,usuarioId:string,nome:string,max:number,permitido:import('drizzle-orm').SQL) {
 const [r]=await loteAtomico(db,[limiteSala(usuarioId,nome,max,60000,permitido)]);
 if(!r.results.length)throw new ErroApi('Sala indisponível ou limite de consultas atingido. Aguarde e tente novamente.',404);
}
