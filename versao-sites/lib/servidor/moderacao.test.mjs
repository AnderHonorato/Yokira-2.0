import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

// Exercise the real route and Drizzle D1 adapter against SQLite; the platform
// injects the authenticated header and real D1 binding in production.
const sqlite=new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys=ON');
const pasta=new URL('../../drizzle/',import.meta.url);
for(const file of readdirSync(pasta).filter(f=>f.endsWith('.sql')).sort())sqlite.exec(readFileSync(new URL(file,pasta),'utf8'));
class Prepared {
 constructor(query,params=[]){this.query=query;this.params=params;}
 bind(...params){return new Prepared(this.query,params);}
 async raw(){const stmt=sqlite.prepare(this.query);stmt.setReturnArrays(true);return stmt.all(...this.params);}
 async all(){return {success:true,results:sqlite.prepare(this.query).all(...this.params),meta:{}};}
 async run(){const result=sqlite.prepare(this.query).run(...this.params);return {success:true,results:[],meta:{changes:Number(result.changes)}};}
}
globalThis.__yokiraEnv={DB:{prepare(query){return new Prepared(query);},async batch(stmts){sqlite.exec('BEGIN');try{const result=[];for(const stmt of stmts)result.push(await stmt.all());sqlite.exec('COMMIT');return result;}catch(error){sqlite.exec('ROLLBACK');throw error;}}}};
registerHooks({resolve(specifier,context,next){
 if(specifier==='cloudflare:workers')return {url:'data:text/javascript,export const env=globalThis.__yokiraEnv',shortCircuit:true};
 try{return next(specifier,context);}catch(error){
 if(specifier.startsWith('.'))for(const suffix of ['.ts','/index.ts']){const url=new URL(specifier+suffix,context.parentURL);if(existsSync(url))return next(url.href,context);}
 throw error;
 }
}});
globalThis.__yokiraEnv.YOKIRA_ADMIN_EMAILS='dono@example.test';
const { GET, POST }=await import('../../app/api/yokira/route.ts');
const identidade=(id,email)=>({'oai-authenticated-user-id':id,...(email?{'oai-authenticated-user-email':email}:{})});
async function get(id,acao='estado',email,extra=''){
 const r=await GET(new Request(`https://yokira.test/api/yokira?acao=${acao}${extra}`,{headers:identidade(id,email)}));
 return {status:r.status,data:await r.json()};
}
async function post(id,dados,email){
 const r=await POST(new Request('https://yokira.test/api/yokira',{method:'POST',headers:{...identidade(id,email),'content-type':'application/json',origin:'https://yokira.test'},body:JSON.stringify(dados)}));
 return {status:r.status,data:await r.json()};
}
const motivo='Verificado pela equipe.';
const mudar=(usuarioId,papel)=>({acao:'alterar-papel',usuarioId,papel,motivo});
const ocultar=(alvoTipo,alvoId,oculto)=>({acao:'moderar-conteudo',alvoTipo,alvoId,oculto,motivo});
async function preparar(){
 await get('admin','estado','dono@example.test');
 for(const id of ['membro','moderador','editor','admin-b'])await get(id);
 for(const [id,papel] of [['moderador','moderador'],['editor','editor'],['admin-b','administrador']])assert.equal((await post('admin',mudar(id,papel))).status,200);
}
test('bootstrap exige email do dispatch na allowlist e não aceita papel enviado pelo cliente',async()=>{
 assert.equal((await get('primeiro')).data.usuario.papel,'membro');
 assert.equal((await get('sem-email')).data.usuario.papel,'membro');
 assert.equal((await get('errado','estado','outra@example.test')).data.usuario.papel,'membro');
 assert.equal((await post('primeiro',{acao:'perfil',nome:'Pessoa',papel:'administrador',email:'dono@example.test'})).data.usuario.papel,'membro');
 const admin=await get('admin','estado',' DONO@example.test ');assert.equal(admin.status,200);assert.equal(admin.data.usuario.papel,'administrador');
 const registros=sqlite.prepare("select count(*) total from registros_moderacao where acao='administrador-configurado'").get().total;
 await get('admin','estado','dono@example.test');assert.equal(sqlite.prepare("select count(*) total from registros_moderacao where acao='administrador-configurado'").get().total,registros);
 assert.equal((await get('primeiro','moderacao')).status,403);
});
test('equipe pode moderar e suspensão impede gravações sem esconder o estado da conta',async()=>{
 await preparar();
 assert.equal((await get('moderador','moderacao')).status,200);
 assert.equal((await get('editor','moderacao')).status,403);
 assert.equal((await post('moderador',mudar('membro','administrador'))).status,403);
 assert.equal((await post('membro',mudar('membro','administrador'))).status,403);
 const suspender=id=>({acao:'suspender-usuario',usuarioId:id,suspenso:true,motivo});
 assert.equal((await post('moderador',suspender('admin'))).status,403);
 assert.equal((await post('moderador',suspender('moderador'))).status,403);
 assert.equal((await post('moderador',suspender('membro'))).status,200);
 const estado=await get('membro');assert.equal(estado.status,200);assert.equal(estado.data.usuario.suspenso,true);
 for(const acao of [{acao:'perfil',nome:'Alterado'},{acao:'lista',tituloId:'1'},{acao:'publicar',tipo:'forum',titulo:'Teste',corpo:'Teste'},{acao:'jogo',modo:'gacha'}])assert.equal((await post('membro',acao)).status,403);
 assert.equal((await post('moderador',{...suspender('membro'),suspenso:false})).status,200);
 assert.equal((await post('membro',{acao:'perfil',nome:'Reativado'})).status,200);
 assert.equal((await post('admin',suspender('moderador'))).status,200);
 assert.equal((await get('moderador','moderacao')).status,403);
 assert.equal((await post('admin',{...suspender('moderador'),suspenso:false})).status,200);
});
test('denúncias são persistidas, conteúdo oculto some das leituras públicas e bloqueia interação',async()=>{
 const criado=await post('membro',{acao:'publicar',tipo:'lista',titulo:'Pesquisa visível',corpo:'Escolha um favorito.',tituloIds:['1','2']});
 const id=criado.data.id;assert.ok(id);
 const resposta=await post('editor',{acao:'responder',publicacaoId:id,corpo:'Minha escolha.'});assert.equal(resposta.status,200);
 const denunciar={acao:'denunciar',alvoTipo:'resposta',alvoId:resposta.data.id,motivo};
 assert.equal((await post('membro',denunciar)).status,200);assert.equal((await post('membro',denunciar)).status,200);
 assert.equal(sqlite.prepare('select count(*) total from denuncias where alvo_id=?').get(resposta.data.id).total,1);
 assert.equal((await post('membro',ocultar('resposta',resposta.data.id,true))).status,403);
 assert.equal((await post('moderador',ocultar('resposta',resposta.data.id,true))).status,200);
 let detalhe=await get('', 'publicacao',undefined,`&id=${id}`);assert.equal(detalhe.status,200);assert.equal(detalhe.data.publicacao.comentarios.length,0);assert.equal(detalhe.data.publicacao.respostas,0);
 assert.equal((await post('moderador',ocultar('publicacao',id,true))).status,200);
 assert.equal((await get('', 'publicacao',undefined,`&id=${id}`)).status,404);
 assert.equal((await get('','publico')).data.publicacoes.some(p=>p.id===id),false);
 assert.equal((await get('membro')).data.publicacoes.some(p=>p.id===id),false);
 assert.equal((await post('membro',{acao:'votar',publicacaoId:id,tituloId:'1'})).status,400);
 assert.equal((await post('membro',{acao:'responder',publicacaoId:id,corpo:'Tentativa.'})).status,404);
 assert.equal((await post('membro',{...denunciar,alvoTipo:'publicacao',alvoId:id})).status,404);
 assert.equal((await post('moderador',ocultar('publicacao',id,false))).status,200);
 assert.equal((await post('moderador',ocultar('resposta',resposta.data.id,false))).status,200);
 detalhe=await get('', 'publicacao',undefined,`&id=${id}`);assert.equal(detalhe.data.publicacao.comentarios.length,1);
 const painel=await get('moderador','moderacao');const denuncia=painel.data.denuncias.find(d=>d.alvoId===resposta.data.id);assert.equal(denuncia.alvoTitulo,'Pesquisa visível');assert.equal(denuncia.alvoCorpo,'Minha escolha.');assert.equal(denuncia.alvoOculto,false);
 assert.equal((await post('moderador',{acao:'resolver-denuncia',denunciaId:denuncia.id,resolvida:true,motivo})).status,200);
 assert.equal(sqlite.prepare('select resolvida from denuncias where id=?').get(denuncia.id).resolvida,1);
 assert.ok((await get('admin','moderacao')).data.registros.some(r=>r.acao==='moderar-conteudo'&&r.alvoId===id));
});
test('somente administrador edita nomes e textos e pesquisas filtram conteúdo',async()=>{
 const criado=await post('membro',{acao:'publicar',tipo:'forum',titulo:'Texto inicial',corpo:'Corpo inicial.'});
 const edicao={acao:'editar-conteudo',alvoTipo:'publicacao',alvoId:criado.data.id,titulo:'Título revisado',corpo:'Corpo revisado com unicórnio.',motivo};
 assert.equal((await post('moderador',edicao)).status,403);assert.equal((await post('admin',edicao)).status,200);
 const resposta=await post('editor',{acao:'responder',publicacaoId:criado.data.id,corpo:'Resposta original'});
 assert.equal((await post('admin',{...edicao,alvoTipo:'resposta',alvoId:resposta.data.id,corpo:'Resposta revisada'})).status,200);
 const editar={acao:'editar-usuario',usuarioId:'membro',nome:'Nome revisado',motivo};
 assert.equal((await post('moderador',editar)).status,403);assert.equal((await post('admin',editar)).status,200);
 const detalhe=await get('', 'publicacao',undefined,`&id=${criado.data.id}`);assert.equal(detalhe.data.publicacao.titulo,'Título revisado');assert.equal(detalhe.data.publicacao.autor.nome,'Nome revisado');assert.equal(detalhe.data.publicacao.comentarios[0].corpo,'Resposta revisada');
 const busca=await get('admin','moderacao',undefined,'&busca=unic%C3%B3rnio');assert.equal(busca.data.publicacoes.length,1);assert.equal(busca.data.publicacoes[0].id,criado.data.id);
 assert.equal((await post('admin',{...editar,nome:''})).status,400);
 assert.equal((await post('admin',{...edicao,motivo:'x'})).status,400);
});
test('catálogo pode ser ocultado e restaurado sem apagar lista existente',async()=>{
 assert.equal((await post('membro',{acao:'lista',tituloId:'3',adicionado:true})).status,200);
 const payload={acao:'moderar-catalogo',tituloId:'3',oculto:true,motivo};
 assert.equal((await post('membro',payload)).status,403);assert.equal((await post('moderador',payload)).status,200);
 assert.ok((await get('','publico')).data.titulosOcultos.includes('3'));assert.ok((await get('membro')).data.titulosOcultos.includes('3'));
 assert.equal((await post('membro',{acao:'lista',tituloId:'3',adicionado:true})).status,404);
 assert.equal((await post('membro',{acao:'acompanhamento',tituloId:'3',situacao:'planejado',episodiosVistos:0,nota:null})).status,404);
 assert.ok((await get('membro')).data.minhaLista.includes('3'));
 assert.equal((await post('admin',{...payload,oculto:false})).status,200);
 assert.equal((await post('membro',{acao:'lista',tituloId:'3',adicionado:true})).status,200);
 assert.equal((await post('admin',{...payload,tituloId:'inexistente'})).status,404);
});
test('o último administrador ativo é protegido atomicamente e ações negadas não geram auditoria',async()=>{
 const antes=sqlite.prepare('select count(*) total from registros_moderacao').get().total;
 assert.equal((await post('moderador',mudar('admin','membro'))).status,403);
 assert.equal(sqlite.prepare('select count(*) total from registros_moderacao').get().total,antes);
 assert.throws(()=>sqlite.exec("update usuarios set papel='membro' where papel='administrador'"),/ultimo_administrador/);
 assert.equal(sqlite.prepare("select count(*) total from usuarios where papel='administrador'").get().total,2);
 assert.equal((await post('admin',mudar('admin-b','membro'))).status,200);
 assert.equal((await post('admin',mudar('admin','membro'))).status,409);
 assert.equal(sqlite.prepare("select papel from usuarios where id='admin'").get().papel,'administrador');
 assert.throws(()=>sqlite.exec("delete from usuarios where id='admin'"),/ultimo_administrador/);
 assert.throws(()=>sqlite.exec("update usuarios set suspenso=1 where id='admin'"),/ultimo_administrador/);
 assert.throws(()=>sqlite.exec("update usuarios set papel='proprietario' where id='membro'"),/papel_invalido/);
 const {mutar}=await import('./yokira.ts');const {getDb}=await import('../../db/index.ts');
 const anterior={id:'admin-b',nome:'Antigo admin',papel:'administrador',suspenso:false,xp:0,criadoEm:0};
 await assert.rejects(()=>mutar(getDb(),anterior,mudar('membro','administrador')),/Ação não permitida/);
 assert.equal(sqlite.prepare("select papel from usuarios where id='membro'").get().papel,'membro');
});
test('publicação revalida papel e suspensão sem criar opções nem conceder XP com identidade antiga',async()=>{
 const {mutar}=await import('./yokira.ts');const {getDb}=await import('../../db/index.ts');
 const id='editor-revogado';
 sqlite.prepare('insert into usuarios(id,nome,papel,criado_em) values (?,?,?,?)').run(id,'Editor revogado','editor',Date.now());
 const anterior={id,nome:'Editor revogado',papel:'editor',suspenso:false,xp:0,criadoEm:0};
 const publicar={acao:'publicar',tipo:'editorial',titulo:'Publicação em trânsito',corpo:'Conteúdo validado para publicação.'};
 sqlite.prepare("update usuarios set papel='membro' where id=?").run(id);
 await assert.rejects(()=>mutar(getDb(),anterior,publicar),erro=>erro.status===403);
 sqlite.prepare('update usuarios set suspenso=1 where id=?').run(id);
 for(const payload of [{...publicar,tipo:'forum'},{...publicar,tipo:'lista',tituloIds:['1','2']}])
  await assert.rejects(()=>mutar(getDb(),anterior,payload),erro=>erro.status===403);
 assert.equal(sqlite.prepare('select count(*) total from publicacoes where autor_id=?').get(id).total,0);
 assert.equal(sqlite.prepare('select xp from usuarios where id=?').get(id).xp,0);
 sqlite.prepare('update usuarios set suspenso=0 where id=?').run(id);
 const salvo=await mutar(getDb(),anterior,{...publicar,tipo:'lista',tituloIds:['1','2']});
 assert.equal(sqlite.prepare('select count(*) total from opcoes where publicacao_id=?').get(salvo.id).total,2);
 assert.equal(sqlite.prepare('select xp from usuarios where id=?').get(id).xp,10);
});
