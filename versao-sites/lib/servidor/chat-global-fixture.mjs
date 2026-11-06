import {DatabaseSync} from 'node:sqlite';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {registerHooks} from 'node:module';

export const sqlite=new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys=ON');
const pasta=new URL('../../drizzle/',import.meta.url);
for(const arquivo of readdirSync(pasta).filter(a=>a.endsWith('.sql')).sort())sqlite.exec(readFileSync(new URL(arquivo,pasta),'utf8'));
let interceptar=()=>{};
class Prepared{
 constructor(query,params=[]){this.query=query;this.params=params;}
 bind(...params){return new Prepared(this.query,params);}
 raw(){const st=sqlite.prepare(this.query);st.setReturnArrays(true);return st.all(...this.params);}
 executar(){return {success:true,results:sqlite.prepare(this.query).all(...this.params),meta:{}};}
 async all(){return this.executar();}
 run(){const r=sqlite.prepare(this.query).run(...this.params);return {success:true,results:[],meta:{changes:Number(r.changes)}};}
}
globalThis.__chatGlobalEnv={DB:{prepare:q=>new Prepared(q),async batch(stmts){
 interceptar(stmts);sqlite.exec('BEGIN');
 try{const rs=stmts.map(s=>s.executar());sqlite.exec('COMMIT');return rs;}
 catch(e){sqlite.exec('ROLLBACK');throw e;}
}}};
registerHooks({resolve(spec,ctx,next){
 if(spec==='cloudflare:workers')return {url:'data:text/javascript,export const env=globalThis.__chatGlobalEnv',shortCircuit:true};
 try{return next(spec,ctx);}catch(e){
  if(spec.startsWith('.'))for(const suffix of ['.ts','/index.ts']){const u=new URL(spec+suffix,ctx.parentURL);if(existsSync(u))return next(u.href,ctx);}
  throw e;
 }
}});
const {getDb}=await import('../../db/index.ts');
export const db=getDb();
export const usuario=i=>({id:`chat-u${i}`,nome:`Pessoa ${i}`,papel:i===0||i===22?'administrador':i===1?'moderador':'membro',suspenso:false});
for(let i=0;i<24;i++){
 sqlite.prepare('insert into usuarios(id,nome,papel,criado_em) values(?,?,?,1)').run(usuario(i).id,i===23?'privado@email.test':usuario(i).nome,usuario(i).papel);
 sqlite.prepare('insert into perfis_sociais(usuario_id,handle,publico,atualizado_em) values(?,?,0,1)').run(usuario(i).id,`chat_pessoa_${i}`);
}
sqlite.exec("insert into temporadas(id,titulo_id,numero,nome,ordem,criado_em,atualizado_em) values('chat-temp','1',1,'Temporada',1,1,1)");
sqlite.exec("insert into episodios(id,temporada_id,titulo_id,numero,titulo,duracao,video_url,publicado,criado_em,atualizado_em) values('chat-ep','chat-temp','1',1,'Episódio reservado',24,'https://cdn.test/segredo.mp4',1,1,1)");
export function imagem(i,finalidade='chat'){
 const id=crypto.randomUUID();
 sqlite.prepare('insert into chat_imagens(id,usuario_id,chave,mime,tamanho,finalidade,criado_em) values(?,?,?,?,?,?,?)').run(id,usuario(i).id,`imagens/segredo/${id}`,'image/png',10,finalidade,Date.now());
 return `/api/comunidade/imagens/${id}`;
}
export function antesEscrita(acao,tabela='chat_mensagens'){
 interceptar=stmts=>{if(stmts.some(s=>new RegExp(`(?:insert\\s+(?:or\\s+\\w+\\s+)?into|update)\\s+["\x60]?${tabela}\\b`,'i').test(s.query))){interceptar=()=>{};acao();}};
}
export const quantidade=()=>sqlite.prepare('select count(*) n from chat_mensagens').get().n;
export function limpar(){interceptar=()=>{};sqlite.exec('delete from chat_mensagens;delete from limites');}
