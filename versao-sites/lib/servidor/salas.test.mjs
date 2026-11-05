import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {registerHooks} from 'node:module';
import {test} from 'node:test';
const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');
const pasta=new URL('../../drizzle/',import.meta.url);
for(const arq of readdirSync(pasta).filter(a=>a.endsWith('.sql')).sort())sqlite.exec(readFileSync(new URL(arq,pasta),'utf8'));
let antesLote=()=>{};
class Prepared {
 constructor(query,params=[]){this.query=query;this.params=params;}
 bind(...params){return new Prepared(this.query,params);}
 raw(){const st=sqlite.prepare(this.query);st.setReturnArrays(true);return st.all(...this.params);}
 executar(){return {success:true,results:sqlite.prepare(this.query).all(...this.params),meta:{}};}
 async all(){return this.executar();}
 run(){const r=sqlite.prepare(this.query).run(...this.params);return {success:true,results:[],meta:{changes:Number(r.changes)}};}
}
globalThis.__salasEnv={DB:{prepare:q=>new Prepared(q),async batch(stmts){antesLote();sqlite.exec('BEGIN');try{const rs=stmts.map(s=>s.executar());sqlite.exec('COMMIT');return rs;}catch(e){sqlite.exec('ROLLBACK');throw e;}}}};
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
let dupla,grupo;
test('convites privados imprevisíveis e leitura exige associação ativa',async()=>{
 dupla=await criar();assert.match(dupla.convite,/^[a-f0-9]{64}$/);assert.notEqual(dupla.convite,dupla.salaId);
 assert.equal((await obterSalas(db,u(1))).salas.length,0);
 await assert.rejects(()=>obterSala(db,u(1),dupla.salaId),e=>e.status===404);
 await assert.rejects(()=>msg(1,dupla.salaId),e=>e.status===403);
 await entrar(1,dupla.convite);
 assert.equal((await obterSala(db,u(1),dupla.salaId)).convite,undefined);
 assert.equal((await obterSala(db,u(0),dupla.salaId)).convite,dupla.convite);
 await assert.rejects(()=>entrar(2,dupla.convite),e=>e.status===409);
 await assert.rejects(()=>entrar(2,'x'.repeat(64)),/inválido/);
});
test('capacidade atômica sob entradas concorrentes e retorno idempotente',async()=>{
 grupo=await criar(2,'grupo');
 const resultados=await Promise.allSettled(Array.from({length:18},(_,i)=>entrar(i+3,grupo.convite)));
 assert.equal(resultados.filter(r=>r.status==='fulfilled').length,11);
 assert.equal(sqlite.prepare('select count(*) n from sala_membros where sala_id=? and ativo=1').get(grupo.salaId).n,12);
 await entrar(3,grupo.convite);assert.equal((await obterSala(db,u(3),grupo.salaId)).participantes,12);
});
test('somente dono controla/expulsa/encerra e revisão otimista impede eventos antigos',async()=>{
 const p={acao:'sala-sincronizar',salaId:dupla.salaId,pausado:false,posicao:34.5,revisao:0};
 await assert.rejects(()=>mutarSala(db,u(1),p),e=>e.status===403);
 await mutarSala(db,u(0),p);
 await assert.rejects(()=>mutarSala(db,u(0),p),e=>e.status===409);
 assert.equal((await obterSala(db,u(1),dupla.salaId)).estado.revisao,1);
 await assert.rejects(()=>mutarSala(db,u(1),{acao:'sala-expulsar',salaId:dupla.salaId,usuarioId:'u0'}));
 await assert.rejects(()=>mutarSala(db,u(1),{acao:'sala-encerrar',salaId:dupla.salaId}));
 await assert.rejects(()=>mutarSala(db,u(0),{...p,posicao:Infinity,revisao:1}));
});
test('mensagens limitadas persistem texto literal e nomes não revelam emails',async()=>{
 const s=await criar(21);await msg(21,s.salaId,'<script>alert(1)</script>');
 const l=await obterSala(db,u(21),s.salaId);assert.equal(l.mensagens[0].corpo,'<script>alert(1)</script>');assert.equal(l.membros[0].nome,'Membro Yokira');
 await assert.rejects(()=>msg(21,s.salaId,'x'.repeat(1001)),/1000/);
 for(let i=0;i<11;i++)await msg(21,s.salaId);
 await assert.rejects(()=>msg(21,s.salaId),e=>e.status===403);
});
test('bloqueio social impede leitura/mensagem/entrada mas dono pode remover bloqueado',async()=>{
 sqlite.exec("insert into bloqueios_sociais(autor_id,alvo_id,criado_em) values('u1','u0',1)");
 await assert.rejects(()=>obterSala(db,u(1),dupla.salaId),e=>e.status===404);
 await assert.rejects(()=>msg(0,dupla.salaId));
 await assert.rejects(()=>entrar(1,dupla.convite));
 await mutarSala(db,u(0),{acao:'sala-expulsar',salaId:dupla.salaId,usuarioId:'u1'});
 sqlite.exec("delete from bloqueios_sociais where autor_id='u1'");
 await assert.rejects(()=>entrar(1,dupla.convite));
 await assert.rejects(()=>obterSala(db,u(1),dupla.salaId));
 assert.equal((await obterSala(db,u(0),dupla.salaId)).participantes,1);
});
test('suspensão concorrente à escrita é revalidada dentro do lote SQL',async()=>{
 antesLote=()=>{antesLote=()=>{};sqlite.exec("update usuarios set suspenso=1 where id='u3'");};
 await assert.rejects(()=>msg(3,grupo.salaId));
 await assert.rejects(()=>obterSala(db,u(3),grupo.salaId));
 assert.equal(sqlite.prepare('select count(*) n from sala_mensagens where autor_id=?').get('u3').n,0);
 sqlite.exec("update usuarios set suspenso=0 where id='u3'");
});
test('saída e revogações concorrentes impedem escritas sem deixar associação órfã',async()=>{
 const nova=await criar(5);await entrar(6,nova.convite);
 await mutarSala(db,u(6),{acao:'sala-sair',salaId:nova.salaId});
 await assert.rejects(()=>obterSala(db,u(6),nova.salaId));await assert.rejects(()=>msg(6,nova.salaId));
 await entrar(6,nova.convite);
 antesLote=()=>{antesLote=()=>{};sqlite.prepare('update sala_membros set ativo=0,expulso=1 where sala_id=? and usuario_id=?').run(nova.salaId,'u6');};
 await assert.rejects(()=>msg(6,nova.salaId));
 assert.equal(sqlite.prepare('select count(*) n from sala_mensagens where sala_id=?').get(nova.salaId).n,0);
 const antes=sqlite.prepare('select count(*) n from salas').get().n;
 antesLote=()=>{antesLote=()=>{};sqlite.exec("update episodios set publicado=0 where id='ep'");};
 await assert.rejects(()=>criar(7));
 assert.equal(sqlite.prepare('select count(*) n from salas').get().n,antes);
 assert.equal(sqlite.prepare('select count(*) n from sala_membros m left join salas s on s.id=m.sala_id where s.id is null').get().n,0);
 sqlite.exec("update episodios set publicado=1 where id='ep'");
});
test('rascunho, futuro, temporada arquivada e título oculto cancelam todos os acessos',async()=>{
 for(const [ocultar,restaurar] of [
  ["update episodios set publicado=0 where id='ep'","update episodios set publicado=1 where id='ep'"],
  [`update episodios set estreia_em=${Date.now()+86400000} where id='ep'`,"update episodios set estreia_em=null where id='ep'"],
  ["update temporadas set arquivado=1 where id='t'","update temporadas set arquivado=0 where id='t'"],
  ["insert into catalogo_disponibilidade(titulo_id,oculto) values('1',1)","delete from catalogo_disponibilidade where titulo_id='1'"]
 ]){sqlite.exec(ocultar);await assert.rejects(()=>obterSala(db,u(0),dupla.salaId));await assert.rejects(()=>entrar(4,dupla.convite));await assert.rejects(()=>msg(0,dupla.salaId));await assert.rejects(()=>criar(4));sqlite.exec(restaurar);}
});
test('moderação requer papel SQL atual, motivo e auditoria; texto só admin edita',async()=>{
 await msg(0,dupla.salaId,'Mensagem revisada');
 const id=(await obterSala(db,u(0),dupla.salaId)).mensagens[0].id;
 await assert.rejects(()=>listarMensagensSalasAdmin(db,u(1)),e=>e.status===403);
 await moderarMensagemSala(db,u(0),{id,oculto:true,motivo:'Conteúdo inadequado.'});
 assert.equal((await obterSala(db,u(0),dupla.salaId)).mensagens.length,0);
 await moderarMensagemSala(db,u(0),{id,oculto:false,corpo:'Mensagem editada',motivo:'Correção administrativa.'});
 assert.equal((await obterSala(db,u(0),dupla.salaId)).mensagens[0].corpo,'Mensagem editada');
 assert.equal((await listarMensagensSalasAdmin(db,u(0))).mensagens.some(m=>m.id===id),true);
 sqlite.exec("update usuarios set papel='administrador' where id='u20'");
 sqlite.exec("update usuarios set papel='membro' where id='u0'");
 await assert.rejects(()=>moderarMensagemSala(db,u(0),{id,oculto:true,motivo:'Papel antigo.'}),e=>e.status===403);
 await assert.rejects(()=>listarMensagensSalasAdmin(db,u(0)),e=>e.status===403);
 sqlite.exec("update usuarios set papel='administrador' where id='u0'");
 assert.equal(sqlite.prepare("select count(*) n from registros_moderacao where alvo_tipo='mensagem-sala'").get().n,2);
});
test('encerramento invalida convite, consultas e qualquer escrita posterior',async()=>{
 await mutarSala(db,u(2),{acao:'sala-encerrar',salaId:grupo.salaId});
 await assert.rejects(()=>entrar(4,grupo.convite));await assert.rejects(()=>obterSala(db,u(3),grupo.salaId));await assert.rejects(()=>msg(2,grupo.salaId));
 assert.equal((await obterSalas(db,u(2))).salas.length,0);
});

test('bloquear numa sala preserva gestão do dono e afasta somente quem deve sair',async()=>{
 const {alterarAmizade}=await import('./social-amizades.ts');
 const sala=await criar(8,'grupo');await entrar(9,sala.convite);await entrar(10,sala.convite);
 await alterarAmizade(db,u(9),{acao:'amizade',operacao:'bloquear',alvoId:'u8'});
 assert.equal((await obterSala(db,u(8),sala.salaId)).participantes,2);
 await assert.rejects(()=>obterSala(db,u(9),sala.salaId));
 await msg(8,sala.salaId,'A sala continua disponível.');
 await alterarAmizade(db,u(8),{acao:'amizade',operacao:'bloquear',alvoId:'u10'});
 assert.equal((await obterSala(db,u(8),sala.salaId)).participantes,1);
 assert.equal(sqlite.prepare('select expulso from sala_membros where sala_id=? and usuario_id=?').get(sala.salaId,'u10').expulso,1);
});
