import {DatabaseSync} from 'node:sqlite';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {registerHooks} from 'node:module';
const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');
const pasta=new URL('../../drizzle/',import.meta.url);
for(const arq of readdirSync(pasta).filter(a=>a.endsWith('.sql')).sort())sqlite.exec(readFileSync(new URL(arq,pasta),'utf8'));
const lote={antes:()=>{}};
class Prepared {
 constructor(query,params=[]){this.query=query;this.params=params;}
 bind(...params){return new Prepared(this.query,params);}
 raw(){const st=sqlite.prepare(this.query);st.setReturnArrays(true);return st.all(...this.params);}
 executar(){return {success:true,results:sqlite.prepare(this.query).all(...this.params),meta:{}};}
 async all(){return this.executar();}
 run(){const r=sqlite.prepare(this.query).run(...this.params);return {success:true,results:[],meta:{changes:Number(r.changes)}};}
}
globalThis.__salasEnv={DB:{prepare:q=>new Prepared(q),async batch(stmts){lote.antes();sqlite.exec('BEGIN');try{const rs=stmts.map(s=>s.executar());sqlite.exec('COMMIT');return rs;}catch(e){sqlite.exec('ROLLBACK');throw e;}}}};
registerHooks({resolve(spec,ctx,next){if(spec==='cloudflare:workers')return {url:'data:text/javascript,export const env=globalThis.__salasEnv',shortCircuit:true};try{return next(spec,ctx);}catch(e){if(spec.startsWith('.'))for(const suffix of ['.ts','/index.ts']){const u=new URL(spec+suffix,ctx.parentURL);if(existsSync(u))return next(u.href,ctx);}throw e;}}});
const {getDb}=await import('../../db/index.ts');
const {mutarSala,obterSala,obterSalas}=await import('./salas.ts');
const {moderarMensagemSala,listarMensagensSalasAdmin}=await import('./salas-moderacao.ts');
const db=getDb();
for(let i=0;i<22;i++)sqlite.prepare('insert into usuarios(id,nome,papel,criado_em) values(?,?,?,1)').run(`u${i}`,i===21?'privado@email.test':`Pessoa ${i}`,i===0?'administrador':'membro');
const u=i=>({id:`u${i}`,nome:`Pessoa ${i}`,papel:i===0?'administrador':'membro',suspenso:false});
sqlite.exec("insert into temporadas(id,titulo_id,numero,nome,ordem,criado_em,atualizado_em) values('t','1',1,'Primeira',1,1,1)");
sqlite.exec("insert into episodios(id,temporada_id,titulo_id,numero,titulo,duracao,video_url,publicado,criado_em,atualizado_em) values('ep','t','1',1,'Publicado',24,'https://cdn.example.test/video.mp4',1,1,1)");
const criar=(i=0,modo='dupla')=>mutarSala(db,u(i),{acao:'sala-criar',tituloId:'1',episodioId:'ep',modo});
const entrar=(i,convite)=>mutarSala(db,u(i),{acao:'sala-entrar',convite});
const msg=(i,salaId,corpo='Olá')=>mutarSala(db,u(i),{acao:'sala-mensagem',salaId,corpo});

export {sqlite,db,u,criar,entrar,msg,mutarSala,obterSala,obterSalas,moderarMensagemSala,listarMensagensSalasAdmin,lote};
