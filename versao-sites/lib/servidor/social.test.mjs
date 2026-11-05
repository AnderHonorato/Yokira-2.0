import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys=ON');
const pasta = new URL('../../drizzle/',import.meta.url);
for(const f of readdirSync(pasta).filter(f=>f.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL(f,pasta),'utf8'));
class Prepared {
 constructor(query,params=[]){this.query=query;this.params=params;}
 bind(...params){return new Prepared(this.query,params);}
 async raw(){const s=sqlite.prepare(this.query);s.setReturnArrays(true);return s.all(...this.params);}
 async all(){return {success:true,results:sqlite.prepare(this.query).all(...this.params),meta:{}};}
}
let antesDoLote = null;
globalThis.__socialEnv={DB:{prepare(query){return new Prepared(query);},async batch(stmts){
 if(antesDoLote)antesDoLote(stmts);
 sqlite.exec('BEGIN');try{const r=[];for(const stmt of stmts)r.push(await stmt.all());sqlite.exec('COMMIT');return r;}
 catch(e){sqlite.exec('ROLLBACK');throw e;}
}}};
registerHooks({resolve(specifier,context,next){
 if(specifier==='cloudflare:workers')return {url:'data:text/javascript,export const env=globalThis.__socialEnv',shortCircuit:true};
 try{return next(specifier,context);}catch(e){if(specifier.startsWith('.'))for(const suffix of ['.ts','/index.ts']){
 const url=new URL(specifier+suffix,context.parentURL);if(existsSync(url))return next(url.href,context);}throw e;}
}});
const {getDb}=await import('../../db/index.ts');
const {garantirPerfil,consultarHandle,obterPerfilSocial,obterPerfilPublico,salvarPerfilSocial,listarAmizades,alterarAmizade}=await import('./social.ts');
const db=getDb();
function usuario(id,nome=id){sqlite.prepare('insert or ignore into usuarios(id,nome,criado_em) values(?,?,1)').run(id,nome);return {id,nome,papel:'membro',suspenso:false,xp:0,criadoEm:1};}
const a=usuario('social-a','Email <privado@example.com>'),b=usuario('social-b','Pessoa B'),c=usuario('social-c','Pessoa C');
const payload=(handle,nome='Pessoa pública')=>({nome,handle,bio:'Uma jornada na comunidade.',publico:true,mostrarConquistas:true});
const operar=(u,operacao,alvoId)=>alterarAmizade(db,u,{acao:'amizade',operacao,alvoId});
const falha=status=>e=>e.status===status;
test('perfil automático é único, idempotente, privado e nunca deriva de email',async()=>{
 const h=await garantirPerfil(db,a);assert.match(h,/^membro_[a-f0-9]{16}$/);assert.equal(await garantirPerfil(db,a),h);
 const p=(await obterPerfilSocial(db,a)).perfil;assert.equal(p.nome,'Membro Yokira');assert.equal(p.publico,false);
 assert.equal(JSON.stringify(p).includes('privado@example.com'),false);
 await assert.rejects(()=>obterPerfilPublico(db,h),falha(404));
 assert.notEqual(await garantirPerfil(db,b),h);
});
test('handle global normaliza caixa, colisão não sobrescreve, sugestão é disponível e gravável',async()=>{
 assert.equal((await salvarPerfilSocial(db,a,payload('@UNICO_123'))).perfil.handle,'unico_123');
 await salvarPerfilSocial(db,b,payload('pessoa_b'));
 await assert.rejects(()=>salvarPerfilSocial(db,b,payload('UNICO_123')),e=>e.status===409&&/Sugestão disponível/.test(e.message));
 assert.equal((await obterPerfilSocial(db,b)).perfil.handle,'pessoa_b');
 const consulta=await consultarHandle(db,b,'unico_123');assert.equal(consulta.disponivel,false);
 assert.equal((await consultarHandle(db,b,consulta.sugestao)).disponivel,true);
 assert.equal((await salvarPerfilSocial(db,b,payload(consulta.sugestao))).perfil.handle,consulta.sugestao);
 await salvarPerfilSocial(db,b,payload('pessoa_b'));
 for(const handle of ['ab','a'.repeat(25),'inválido','admin','../../rota'])await assert.rejects(()=>salvarPerfilSocial(db,a,payload(handle)),falha(400));
 await assert.rejects(()=>salvarPerfilSocial(db,a,{...payload('valido'),usuarioId:b.id}),falha(400));
 await assert.rejects(()=>salvarPerfilSocial(db,a,payload('valido','user@example.com')),falha(400));
});
test('busca limitada não revela privados, email, bloqueios nem aceita injeção SQL',async()=>{
 await garantirPerfil(db,c);
 for(let i=0;i<24;i++){const u=usuario('limite'+i,'Pessoa busca');await salvarPerfilSocial(db,u,payload('busca_'+i));}
 assert.equal((await listarAmizades(db,a,'busca')).resultados.length,20);
 assert.equal((await listarAmizades(db,a,'social-c')).resultados.length,0);
 assert.equal((await listarAmizades(db,a,"' OR 1=1 --")).resultados.length,0);
 assert.equal((await listarAmizades(db,a,'privado@example.com')).resultados.length,0);
});
test('solicitar, aceitar e remover autorizam cada participante e impedem auto amizade/duplicatas',async()=>{
 await assert.rejects(()=>operar(a,'solicitar',a.id),falha(400));
 await operar(a,'solicitar',b.id);await operar(a,'solicitar',b.id);await operar(b,'solicitar',a.id);
 assert.equal(sqlite.prepare('select count(*) n from amizades').get().n,1);
 assert.equal((await listarAmizades(db,a)).enviadas[0].id,b.id);
 assert.equal((await listarAmizades(db,b)).recebidas[0].id,a.id);
 await assert.rejects(()=>operar(a,'aceitar',b.id),falha(409));
 await assert.rejects(()=>operar(c,'aceitar',b.id),falha(409));
 await operar(b,'aceitar',a.id);await operar(b,'aceitar',a.id);
 assert.equal((await listarAmizades(db,a)).amigos[0].id,b.id);
 await salvarPerfilSocial(db,b,{...payload('pessoa_b'),publico:false});
 assert.equal((await obterPerfilPublico(db,'pessoa_b',a)).perfil.relacao,'amigo');
 assert.equal((await listarAmizades(db,a,'pessoa_b')).resultados.length,0);
 await assert.rejects(()=>obterPerfilPublico(db,'pessoa_b',c),falha(404));
 await operar(a,'remover',b.id);await assert.rejects(()=>obterPerfilPublico(db,'pessoa_b',a),falha(404));
 await salvarPerfilSocial(db,b,payload('pessoa_b'));
});
test('recusar, cancelar e bloquear usam direção correta e bloqueio remove o par atomicamente',async()=>{
 await operar(a,'solicitar',b.id);await assert.rejects(()=>operar(a,'recusar',b.id),falha(409));
 await operar(b,'recusar',a.id);await operar(a,'solicitar',b.id);
 await assert.rejects(()=>operar(b,'cancelar',a.id),falha(409));await operar(a,'cancelar',b.id);
 await operar(a,'solicitar',b.id);await operar(b,'bloquear',a.id);await operar(b,'bloquear',a.id);
 assert.equal(sqlite.prepare('select count(*) n from amizades').get().n,0);
 assert.equal((await listarAmizades(db,b)).bloqueados[0].id,a.id);
 await assert.rejects(()=>operar(a,'solicitar',b.id),falha(409));
 await assert.rejects(()=>obterPerfilPublico(db,'unico_123',b),falha(404));
 assert.equal((await listarAmizades(db,a,'pessoa_b')).resultados.length,0);
 await operar(b,'desbloquear',a.id);await operar(a,'solicitar',b.id);
});
test('suspensão entre leitura e escrita impede mutações usando o estado atual D1',async()=>{
 antesDoLote=stmts=>{if(stmts[0].query.startsWith('update amizades'))sqlite.prepare('update usuarios set suspenso=1 where id=?').run(b.id);};
 await assert.rejects(()=>operar(b,'aceitar',a.id),falha(409));antesDoLote=null;
 assert.equal(sqlite.prepare('select estado from amizades').get().estado,'pendente');
 sqlite.prepare('update usuarios set suspenso=0 where id=?').run(b.id);
 antesDoLote=stmts=>{if(stmts[0].query.startsWith('update perfis_sociais'))sqlite.prepare('update usuarios set suspenso=1 where id=?').run(b.id);};
 await assert.rejects(()=>salvarPerfilSocial(db,b,payload('roubado')),falha(403));antesDoLote=null;
 assert.equal(sqlite.prepare('select handle from perfis_sociais where usuario_id=?').get(b.id).handle,'pessoa_b');
 sqlite.prepare('update usuarios set suspenso=0 where id=?').run(b.id);
});
test('constraints persistentes rejeitam par invertido, auto bloqueio e @ duplicado',()=>{
 assert.throws(()=>sqlite.exec("insert into amizades values('social-b','social-a','social-a','pendente',1,1)"),/CHECK/);
 assert.throws(()=>sqlite.exec("insert into bloqueios_sociais values('social-a','social-a',1)"),/CHECK/);
 assert.throws(()=>sqlite.exec("update perfis_sociais set handle='unico_123' where usuario_id='social-b'"),/UNIQUE/);
 assert.throws(()=>sqlite.exec("update perfis_sociais set handle='UPPER' where usuario_id='social-b'"),/CHECK/);
});
test('falha após bloquear reverte tanto bloqueio quanto remoção no mesmo lote',async()=>{
 sqlite.exec("CREATE TRIGGER falha_amizade BEFORE DELETE ON amizades BEGIN SELECT RAISE(ABORT,'erro forçado'); END");
 await assert.rejects(()=>operar(a,'bloquear',b.id));
 assert.equal(sqlite.prepare('select count(*) n from bloqueios_sociais').get().n,0);
 assert.equal(sqlite.prepare('select count(*) n from amizades').get().n,1);
 sqlite.exec('DROP TRIGGER falha_amizade');
});
