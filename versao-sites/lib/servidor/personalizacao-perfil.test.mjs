import assert from 'node:assert/strict';
import {test} from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {sqlite,db,u} from './salas-fixture.mjs';
const {obterPerfilSocial,obterPerfilPublico,salvarPerfilSocial}=await import('./social-perfis.ts');
const {obterCartaoPerfil}=await import('./perfis-ricos.ts');
const {validarVisualPerfil}=await import('./personalizacao-perfil.ts');
const padrao={capa:'origem',moldura:'essencial',aura:'brisa'};
const dados=(i,extra={})=>({nome:`Pessoa perfil ${i}`,handle:`perfil_visual_${i}`,bio:'Minha coleção.',publico:true,mostrarConquistas:true,...extra});
const salvar=(i,extra={})=>salvarPerfilSocial(db,u(i),dados(i,extra));
const rejeita=status=>e=>e.status===status;
function antesDeSalvar(acao){
 const batch=db.$client.batch;
 db.$client.batch=async function(stmts){if(stmts.some(s=>/^update perfis_sociais set/.test(s.query))){acao();db.$client.batch=batch;}return batch.call(this,stmts);};
 return ()=>{db.$client.batch=batch;};
}
test('perfil próprio sincroniza desbloqueios e inventário não acompanha perfil público',async()=>{
 const proprio=await obterPerfilSocial(db,u(1));assert.deepEqual(proprio.perfil.visual,padrao);
 assert.equal(proprio.inventario.length,15);assert.equal(proprio.inventario.find(i=>i.id==='sakura').liberada,true);
 assert.equal(proprio.inventario.find(i=>i.id==='pessoal').liberada,false);
 assert.equal(proprio.inventario.find(i=>i.id==='astral').liberada,false);
 const p=await salvar(1);const publico=await obterPerfilPublico(db,p.perfil.handle);
 assert.equal('inventario' in publico,false);assert.deepEqual(publico.perfil.visual,padrao);
});
test('campos extras, JSON/texto, IDs inválidos e recompensas forjadas são recusados',async()=>{
 for(const visual of [null,[],JSON.stringify(padrao),{...padrao,extra:'x'},{capa:'origem',moldura:'essencial'},
  {...padrao,capa:'https://evil.test/x'}, {...padrao,capa:'x'.repeat(1000)},{...padrao,moldura:42}])
  assert.throws(()=>validarVisualPerfil(visual),rejeita(400));
 await salvar(2);const antes=sqlite.prepare('select nome from usuarios where id=?').get('u2').nome;
 for(const visual of [{...padrao,capa:'astral'},{...padrao,moldura:'prisma'},{...padrao,aura:'aurora'}])
  await assert.rejects(()=>salvar(2,{nome:'Não pode alterar',visual}),rejeita(403));
 assert.equal(sqlite.prepare('select nome from usuarios where id=?').get('u2').nome,antes);
 assert.deepEqual((await obterPerfilSocial(db,u(2))).perfil.visual,padrao);
 await assert.rejects(()=>salvar(2,{visual:padrao,xp:99999}),rejeita(400));
});
test('feitos persistidos liberam capas/molduras e escolha persiste após nova leitura',async()=>{
 sqlite.prepare('insert into lista(usuario_id,titulo_id,criado_em) values(?,?,1)').run('u3','1');
 sqlite.prepare("insert into publicacoes(id,autor_id,tipo,titulo,corpo,criado_em) values('visual-post','u3','forum','Publicação','Texto público',1)").run();
 const v={...padrao,capa:'neon',moldura:'prisma'};
 const salvo=await salvar(3,{visual:v});assert.deepEqual(salvo.perfil.visual,v);
 assert.equal(salvo.inventario.find(i=>i.id==='neon').liberada,true);
 assert.deepEqual((await obterPerfilSocial(db,u(3))).perfil.visual,v);
 assert.deepEqual((await obterPerfilPublico(db,salvo.perfil.handle)).perfil.visual,v);
 await salvar(3,{bio:'Cliente antigo preserva visual.'});assert.deepEqual((await obterPerfilSocial(db,u(3))).perfil.visual,v);
});
test('nível vem do banco e queda de elegibilidade produz fallback na leitura',async()=>{
 sqlite.prepare('update usuarios set xp=1900 where id=?').run('u4');
 const v={...padrao,capa:'astral',moldura:'soberana'};
 const salvo=await salvar(4,{visual:v});assert.deepEqual(salvo.perfil.visual,v);
 sqlite.prepare('update usuarios set xp=0 where id=?').run('u4');
 const publico=await obterPerfilPublico(db,salvo.perfil.handle);assert.deepEqual(publico.perfil.visual,padrao);
 await assert.rejects(()=>salvar(4,{visual:v}),rejeita(403));
});
test('capa pessoal exige imagem própria da finalidade correta e privacidade protege visual',async()=>{
 const id='00000000-0000-4000-8000-000000000055',url='/api/comunidade/imagens/'+id;
 sqlite.prepare("insert into chat_imagens values(?,?,'visual/55','image/webp',12,'banner',1)").run(id,'u5');
 await assert.rejects(()=>salvar(6,{banner:url,visual:{...padrao,capa:'pessoal'}}),rejeita(403));
 const salvo=await salvar(5,{banner:url,visual:{...padrao,capa:'pessoal'},publico:false});
 assert.equal(salvo.perfil.visual.capa,'pessoal');
 await assert.rejects(()=>obterPerfilPublico(db,salvo.perfil.handle),rejeita(404));
 const cartao=await obterCartaoPerfil(db,'u5');assert.equal(cartao.perfil.acessivel,false);
 assert.deepEqual(cartao.perfil.visual,padrao);assert.equal(cartao.perfil.banner,'');
 await assert.rejects(()=>salvar(5,{banner:'',visual:{...padrao,capa:'pessoal'}}),rejeita(403));
 sqlite.prepare("update chat_imagens set finalidade='avatar' where id=?").run(id);
 assert.equal((await obterPerfilSocial(db,u(5))).inventario.find(i=>i.id==='pessoal').liberada,false);
 await assert.rejects(()=>salvar(5,{banner:url,visual:{...padrao,capa:'pessoal'}}),rejeita(403));
});
test('suspensão e revogação de nível imediatamente antes do lote impedem escrita',async()=>{
 await salvar(7);sqlite.prepare('update usuarios set xp=1900 where id=?').run('u7');
 let limpar=antesDeSalvar(()=>sqlite.prepare('update usuarios set xp=0 where id=?').run('u7'));
 try{await assert.rejects(()=>salvar(7,{visual:{...padrao,capa:'astral'}}),rejeita(403));}finally{limpar();}
 assert.deepEqual(JSON.parse(sqlite.prepare('select visual from perfis_sociais where usuario_id=?').get('u7').visual),padrao);
 await salvar(8);limpar=antesDeSalvar(()=>sqlite.prepare('update usuarios set suspenso=1 where id=?').run('u8'));
 try{await assert.rejects(()=>salvar(8,{nome:'Não alterar',visual:padrao}),rejeita(403));}finally{limpar();}
 assert.equal(sqlite.prepare('select nome from usuarios where id=?').get('u8').nome,'Pessoa perfil 8');
});
test('todas as consultas do novo fluxo ficam sob limite de 100 parâmetros D1',async()=>{
 const preparar=db.$client.prepare;let maior=0;
 db.$client.prepare=function(q){const p=preparar.call(this,q),bind=p.bind;p.bind=function(...args){maior=Math.max(maior,args.length);assert.ok(args.length<=100);return bind.apply(this,args);};return p;};
 try{await obterPerfilSocial(db,u(9));await salvar(9,{visual:padrao});await obterCartaoPerfil(db,'u9');assert.ok(maior>0&&maior<=100);}finally{db.$client.prepare=preparar;}
});
test('migração preserva banners antigos e bloqueia JSON inválido',()=>{
 const legado=new DatabaseSync(':memory:');legado.exec('pragma foreign_keys=on');
 const pasta=new URL('../../drizzle/',import.meta.url);
 for(const arq of readdirSync(pasta).filter(f=>f.endsWith('.sql')&&f<'0019').sort())legado.exec(readFileSync(new URL(arq,pasta),'utf8'));
 legado.exec("insert into usuarios(id,nome,criado_em) values('antigo','Pessoa antiga',1),('novo','Pessoa nova',1)");
 legado.exec("insert into perfis_sociais(usuario_id,handle,banner,atualizado_em) values('antigo','antigo','/api/comunidade/imagens/arquivo',1),('novo','novo','',1)");
 legado.exec(readFileSync(new URL('0019_personalizacao_perfil.sql',pasta),'utf8'));
 assert.equal(JSON.parse(legado.prepare("select visual from perfis_sociais where usuario_id='antigo'").get().visual).capa,'pessoal');
 assert.deepEqual(JSON.parse(legado.prepare("select visual from perfis_sociais where usuario_id='novo'").get().visual),padrao);
 assert.throws(()=>legado.exec("update perfis_sociais set visual='texto inválido'"),/CHECK|malformed JSON/);
 assert.equal(legado.prepare('pragma foreign_key_check').all().length,0);legado.close();
});

test('capa pessoal não equipada fica reservada ao dono e pode ser recuperada sem reenviar',async()=>{
 const {podeLerImagem}=await import('./imagens-comunidade-acesso.ts');
 const id='00000000-0000-4000-8000-000000000066',url='/api/comunidade/imagens/'+id;
 sqlite.prepare("insert into chat_imagens values(?,?,'visual/66','image/webp',12,'banner',1)").run(id,'u10');
 const salvo=await salvar(10,{banner:url});
 assert.equal(salvo.perfil.visual.capa,'pessoal');
 assert.equal(await podeLerImagem(db,{id,usuarioId:'u10'}),true);
 const guardado=await salvar(10,{visual:padrao});assert.equal(guardado.perfil.banner,url);
 assert.equal((await obterPerfilPublico(db,salvo.perfil.handle)).perfil.banner,'');
 assert.equal((await obterCartaoPerfil(db,'u10')).perfil.banner,'');
 assert.equal(await podeLerImagem(db,{id,usuarioId:'u10'}),false);
 assert.equal(await podeLerImagem(db,{id,usuarioId:'u10'},u(10)),true);
 await salvar(10,{visual:{...padrao,capa:'pessoal'}});
 assert.equal((await obterPerfilPublico(db,salvo.perfil.handle)).perfil.banner,url);
 await salvar(10,{banner:''});assert.equal((await obterPerfilSocial(db,u(10))).perfil.visual.capa,'origem');
});
