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
const { GET, POST }=await import('../../app/api/yokira/route.ts');
async function get(user='pessoa-a',acao='estado',params=''){
 const response=await GET(new Request(`https://yokira.test/api/yokira?acao=${acao}${params}`,{headers:user?{'oai-authenticated-user-id':user}:{}}));
 return {status:response.status,data:await response.json()};
}
async function post(user,body,origin='https://yokira.test'){
 const response=await POST(new Request('https://yokira.test/api/yokira',{method:'POST',headers:{'oai-authenticated-user-id':user,'content-type':'application/json',origin},body:JSON.stringify(body)}));
 return {status:response.status,data:await response.json()};
}
test('admin cria série, temporada e vídeo; público respeita rascunho e posição é privada',async()=>{
 await get('admin-fluxo');await get('espectador-a');await get('espectador-b');
 sqlite.prepare("UPDATE usuarios SET papel='administrador' WHERE id='admin-fluxo'").run();
 const dados={slug:'serie-original',nome:'Série original',sinopse:'Uma nova história criada para este acervo.',ano:2026,nota:8.2,generos:['Aventura inédita'],tipo:'Série',status:'Em exibição',episodios:2,duracao:24,poster:'/arte/hero.webp',capa:'/arte/hero.webp',estreia:'2026'};
 const criar={acao:'salvar-acervo',tipo:'titulo',dados,oculto:true,motivo:'Cadastrar nova série'};
 assert.equal((await post('espectador-a',criar)).status,403);
 const serie=await post('admin-fluxo',criar);assert.equal(serie.status,200);
 const tituloId=serie.data.id;
 assert.ok(!(await get(null,'publico')).data.catalogo.some(t=>t.id===tituloId));
 assert.equal((await get(null,'episodios','&tituloId='+tituloId)).status,404);
 const temp={acao:'salvar-temporada',tituloId,numero:1,nome:'Primeira temporada',ordem:1,arquivado:false,motivo:'Organizar a temporada'};
 assert.equal((await post('espectador-a',temp)).status,403);
 const temporada=await post('admin-fluxo',temp);assert.equal(temporada.status,200);
 const ep={acao:'salvar-episodio',tituloId,temporadaId:temporada.data.id,numero:1,titulo:'A primeira descoberta',sinopse:'O começo desta aventura.',duracao:24,videoUrl:'',poster:'',publicado:false,arquivado:false,estreiaEm:null,motivo:'Preparar episódio'};
 const rascunho=await post('admin-fluxo',ep);assert.equal(rascunho.status,200);
 assert.equal((await post('admin-fluxo',{...criar,alvoId:tituloId,oculto:false})).status,200);
 assert.equal((await get(null,'episodios','&tituloId='+tituloId)).data.episodios.length,0);
 assert.equal((await post('admin-fluxo',{...ep,id:rascunho.data.id,videoUrl:'/midia/demonstracao-bbb.mp4',publicado:true})).status,200);
 let publico=await get(null,'episodios','&tituloId='+tituloId);assert.equal(publico.status,200);assert.equal(publico.data.episodios[0].id,rascunho.data.id);
 const progresso={acao:'progresso-episodio',tituloId,episodioId:rascunho.data.id,segundos:12};
 assert.equal((await post('espectador-a',progresso)).status,200);
 assert.equal((await get('espectador-a')).data.progresso.find(p=>p.tituloId==='episodio:'+rascunho.data.id).segundos,12);
 assert.deepEqual((await get('espectador-b')).data.progresso,[]);
 assert.equal((await post('espectador-b',{...progresso,usuarioId:'espectador-a',segundos:3})).status,200);
 assert.equal((await get('espectador-a')).data.progresso.find(p=>p.tituloId==='episodio:'+rascunho.data.id).segundos,12);
 assert.equal((await post('admin-fluxo',{...temp,id:temporada.data.id,arquivado:true})).status,200);
 publico=await get(null,'episodios','&tituloId='+tituloId);assert.equal(publico.data.episodios.length,0);
 assert.equal((await post('espectador-a',progresso)).status,404);
});
test('filme publicado funciona sem temporada e edição de categorias chega à leitura pública',async()=>{
 const dados={slug:'filme-original',nome:'Filme original',sinopse:'Uma aventura completa em um único filme.',ano:2026,nota:7.5,generos:['Fantasia nova'],tipo:'Filme',status:'Completo',episodios:1,duracao:90,poster:'/arte/hero.webp',capa:'/arte/hero.webp',estreia:'2026'};
 const filme=await post('admin-fluxo',{acao:'salvar-acervo',tipo:'titulo',dados,oculto:false,motivo:'Cadastrar filme original'});assert.equal(filme.status,200);
 const video=await post('admin-fluxo',{acao:'salvar-episodio',tituloId:filme.data.id,temporadaId:null,numero:1,titulo:dados.nome,sinopse:dados.sinopse,duracao:90,videoUrl:'/midia/demonstracao-bbb.mp4',poster:'',publicado:true,arquivado:false,motivo:'Publicar vídeo do filme'});assert.equal(video.status,200);
 const publico=await get(null,'episodios','&tituloId='+filme.data.id);assert.equal(publico.data.episodios[0].id,video.data.id);assert.equal(publico.data.temporadas.length,0);
 assert.ok((await get(null,'publico')).data.catalogo.find(t=>t.id===filme.data.id).generos.includes('Fantasia nova'));
});
test('rotas de notificações guardam origem e reivindicam celebração uma única vez',async()=>{
 assert.equal((await get(null,'notificacoes')).status,401);
 const inicial=await get('espectador-a','notificacoes');assert.equal(inicial.status,200);
 const evento=inicial.data.notificacoes.find(n=>n.tipo==='conquista');assert.ok(evento);assert.ok(evento.destino.startsWith('/?p='));
 const reivindicar={acao:'notificacoes-ver',ids:[evento.id],celebrar:true};
 assert.equal((await post('espectador-b',reivindicar)).data.eventos.length,0);
 assert.equal((await post('espectador-a',reivindicar)).data.eventos.length,1);
 assert.equal((await post('espectador-a',reivindicar)).data.eventos.length,0);
 assert.ok((await get('espectador-a','notificacoes')).data.notificacoes.find(n=>n.id===evento.id).celebradaEm);
});
test('retomada individual encontra episódios além dos 200 recentes sem expor outra conta',async()=>{
 await get('retomada-longa');
 const inserir=sqlite.prepare('INSERT INTO progresso(usuario_id,titulo_id,segundos,atualizado_em) VALUES(?,?,?,?)');
 for(let indice=0;indice<=200;indice++)inserir.run('retomada-longa','episodio:e'+String(indice).padStart(3,'0'),30,indice);
 assert.equal((await get('retomada-longa')).data.progresso.length,200);
 const resultado=await get('retomada-longa','progresso-episodio','&episodioId=e200');
 assert.equal(resultado.status,200);assert.equal(resultado.data.segundos,30);
 assert.equal((await get('espectador-b','progresso-episodio','&episodioId=e200&usuarioId=retomada-longa')).data.segundos,0);
 assert.equal((await get(null,'progresso-episodio','&episodioId=e200')).status,401);
});
test('subida de nível guarda o caminho exato da participação que concedeu XP',async()=>{
 await get('nivel-com-origem');
 sqlite.prepare('UPDATE usuarios SET xp=90 WHERE id=?').run('nivel-com-origem');
 const publicacao=await post('nivel-com-origem',{acao:'publicar',tipo:'forum',titulo:'Uma descoberta',corpo:'Compartilhando esta história com a comunidade.'});
 assert.equal(publicacao.status,200);
 const avisos=await get('nivel-com-origem','notificacoes');
 const nivel=avisos.data.notificacoes.find(item=>item.tipo==='nivel');assert.ok(nivel);
 assert.equal(nivel.destino,'/?p=forum&post='+publicacao.data.id);
 assert.equal(avisos.data.notificacoes.filter(item=>item.tipo==='nivel').length,1);
});
