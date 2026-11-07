import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys=ON');
const pasta = new URL('../../drizzle/', import.meta.url);
for (const arquivo of readdirSync(pasta).filter(a => a.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL(arquivo,pasta),'utf8'));
class Prepared {
    constructor(query, params=[]) { this.query=query; this.params=params; }
    bind(...params) { return new Prepared(this.query, params); }
    async raw() { const stmt=sqlite.prepare(this.query); stmt.setReturnArrays(true); return stmt.all(...this.params); }
    async all() { return { success:true, results:sqlite.prepare(this.query).all(...this.params), meta:{} }; }
    async run() { const result=sqlite.prepare(this.query).run(...this.params); return {success:true,results:[],meta:{changes:Number(result.changes)}}; }
}
globalThis.__bannersEnv={DB:{prepare(query){return new Prepared(query);},async batch(stmts){sqlite.exec('BEGIN');try{const rs=[];for(const s of stmts)rs.push(await s.all());sqlite.exec('COMMIT');return rs;}catch(e){sqlite.exec('ROLLBACK');throw e;}}}};
registerHooks({resolve(s,c,next){if(s==='cloudflare:workers')return {url:'data:text/javascript,export const env=globalThis.__bannersEnv',shortCircuit:true};try{return next(s,c);}catch(e){if(s.startsWith('.'))for(const suffix of ['.ts','/index.ts']){const u=new URL(s+suffix,c.parentURL);if(existsSync(u))return next(u.href,c);}throw e;}}});
const {getDb}=await import('../../db/index.ts');
const {obterBanners,obterBannersAdmin,salvarBanner,arquivarBanner,configurarBanners}=await import('./banners.ts');
const {GET,POST}=await import('../../app/api/yokira/route.ts');
const db=getDb(),admin={id:'admin-banner',nome:'Admin',papel:'administrador',suspenso:false},membro={...admin,id:'membro-banner',papel:'membro'};
for(const u of [admin,membro,{...admin,id:'reserva-banner'}])sqlite.prepare('insert into usuarios(id,nome,papel,criado_em) values(?,?,?,1)').run(u.id,u.nome,u.papel);
const dados={tituloId:'2',imagem:'/arte/banners/one-piece-cenario.webp',personagem:'/arte/banners/one-piece-personagem.webp',link:'/?p=titulo&id=2',intervaloSegundos:null,ordem:5,ativo:true,motivo:'Definir destaque no início.'};
let salvo;
test('banners públicos seguem ordem, duração padrão e visibilidade do catálogo',async()=>{
 const antes=await obterBanners(db);assert.equal(antes.length,3);assert.equal(antes[0].titulo.nome,'One Piece');assert.equal(antes[0].intervaloEfetivoSegundos,8);
 await configurarBanners(db,admin,{intervaloPadraoSegundos:12,motivo:'Aumentar tempo de leitura.'});
 salvo=await salvarBanner(db,admin,dados);assert.equal((await obterBanners(db)).find(b=>b.id===salvo.id).intervaloEfetivoSegundos,12);
 await salvarBanner(db,admin,{...dados,id:salvo.id,intervaloSegundos:3,ordem:0});
 assert.equal((await obterBanners(db)).find(b=>b.id===salvo.id).intervaloEfetivoSegundos,3);
 sqlite.exec("insert into catalogo_disponibilidade(titulo_id,oculto) values('2',1)");
 assert.equal((await obterBanners(db)).some(b=>b.tituloId==='2'),false);
 assert.equal((await obterBannersAdmin(db,admin)).banners.some(b=>b.id===salvo.id),true);
 sqlite.exec("update catalogo_disponibilidade set oculto=0 where titulo_id='2'");
});
test('valida intervalo, campos e URLs sem permitir protocolos ativos ou caminhos ambíguos',async()=>{
 for(const patch of [{intervaloSegundos:2},{intervaloSegundos:61},{intervaloSegundos:3.5},{imagem:'javascript:alert(1)'},{personagem:'//externo.test/img.png'},{link:'https://user:senha@externo.test/'},{imagem:'/arte/../segredo.png'},{ativo:1},{admin:true}])await assert.rejects(()=>salvarBanner(db,admin,{...dados,...patch}),e=>e.status===400);
 assert.equal((await salvarBanner(db,admin,{...dados,personagem:'',imagem:'/api/midia/00000000-0000-4000-8000-000000000000'})).ok,true);
});
test('permissão atual protege leitura privada, alterações e auditoria sem confiar no payload',async()=>{
 await assert.rejects(()=>obterBannersAdmin(db,membro),e=>e.status===403);
 await assert.rejects(()=>salvarBanner(db,membro,dados),e=>e.status===403);
 const antes=sqlite.prepare('select count(*) n from registros_moderacao').get().n;
 sqlite.exec("update usuarios set papel='membro' where id='admin-banner'");
 await assert.rejects(()=>salvarBanner(db,admin,{...dados,id:salvo.id}),e=>e.status===403);
 await assert.rejects(()=>configurarBanners(db,admin,{intervaloPadraoSegundos:10,motivo:'Papel antigo.'}),e=>e.status===403);
 await assert.rejects(()=>obterBannersAdmin(db,admin),e=>e.status===403);
 assert.equal(sqlite.prepare('select count(*) n from registros_moderacao').get().n,antes);
 sqlite.exec("update usuarios set papel='administrador' where id='admin-banner'");
 await arquivarBanner(db,admin,{id:salvo.id,motivo:'Remover destaque antigo.'});
 assert.equal((await obterBanners(db)).some(b=>b.id===salvo.id),false);
 await assert.rejects(()=>salvarBanner(db,admin,{...dados,id:salvo.id}),e=>e.status===404);
});
test('API publica somente a galeria e mantém administração autenticada e protegida contra CSRF',async()=>{
 const publico=await GET(new Request('https://yokira.test/api/yokira?acao=banners'));assert.equal(publico.status,200);assert.ok(Array.isArray((await publico.json()).banners));
 assert.equal((await GET(new Request('https://yokira.test/api/yokira?acao=banners-admin'))).status,401);
 const bloqueado=await POST(new Request('https://yokira.test/api/yokira',{method:'POST',headers:{'oai-authenticated-user-id':admin.id,'content-type':'application/json',origin:'https://externo.test'},body:JSON.stringify({acao:'salvar-banner',...dados})}));assert.equal(bloqueado.status,403);
 assert.deepEqual(sqlite.prepare('PRAGMA foreign_key_check').all(),[]);
});
