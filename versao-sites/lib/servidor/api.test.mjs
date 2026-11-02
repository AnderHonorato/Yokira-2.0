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
test('API autentica, bloqueia CSRF e isola lista e progresso pessoais',async()=>{
 assert.equal((await get(null)).status,401);
 assert.equal((await post('pessoa-a',{acao:'perfil',nome:'Ander'},'https://externo.test')).status,403);
 let estado=await get();assert.equal(estado.status,200);assert.equal(estado.data.usuario.nome,'Visitante');assert.equal(estado.data.usuario.email,undefined);
 assert.equal((await post('pessoa-a',{acao:'lista',tituloId:'1'})).data.adicionado,true);
 assert.equal((await post('pessoa-a',{acao:'progresso',tituloId:'demonstracao',segundos:21})).status,200);
 estado=await get();assert.deepEqual(estado.data.minhaLista,['1']);assert.deepEqual(estado.data.progresso,[{tituloId:'demonstracao',segundos:21}]);
 const b=await get('pessoa-b');assert.deepEqual(b.data.minhaLista,[]);assert.deepEqual(b.data.progresso,[]);
 assert.equal((await post('pessoa-a',{acao:'lista',tituloId:'inexistente'})).status,404);
 assert.equal((await post('pessoa-a',{acao:'progresso',tituloId:'1',segundos:-10})).status,400);
 assert.equal((await post('pessoa-a',{acao:'publicar',tipo:'editorial',titulo:'Título',corpo:'Conteúdo'})).status,403);
 assert.equal((await post('pessoa-a',{acao:'perfil',nome:'Ander',papel:'editor'})).data.usuario.papel,'membro');
});
test('API cria lista e respostas, contabiliza votos sem duplicá-los',async()=>{
 const criado=await post('pessoa-a',{acao:'publicar',tipo:'lista',titulo:'Escolha seu anime',corpo:'Qual é o seu favorito?',tituloIds:['1','2']});assert.equal(criado.status,200);
 const publicacaoId=criado.data.id;
 for(let i=0;i<2;i++)assert.equal((await post('pessoa-a',{acao:'votar',publicacaoId,tituloId:'1'})).status,200);
 assert.equal((await post('pessoa-b',{acao:'votar',publicacaoId,tituloId:'2'})).status,200);
 assert.equal((await post('pessoa-b',{acao:'votar',publicacaoId,tituloId:'3'})).status,400);
 assert.equal((await post('pessoa-b',{acao:'responder',publicacaoId,corpo:'Escolhi meu favorito.'})).status,200);
 const detalhe=await get('pessoa-a','publicacao',`&id=${publicacaoId}`);
 assert.equal(detalhe.status,200);assert.equal(detalhe.data.publicacao.votos,2);assert.equal(detalhe.data.publicacao.respostas,1);assert.equal(detalhe.data.publicacao.comentarios.length,1);
 assert.equal(detalhe.data.publicacao.opcoes.find(o=>o.tituloId==='1').meuVoto,true);
});
test('API persiste limites de gacha e oculta respostas dos jogos em andamento',async()=>{
 for(let i=0;i<3;i++)assert.equal((await post('jogador',{acao:'jogo',modo:'gacha'})).data.jogo.restantes,2-i);
 assert.equal((await post('jogador',{acao:'jogo',modo:'gacha'})).status,429);
 const adivinhe=await post('jogador',{acao:'jogo',modo:'adivinhe'});assert.equal(adivinhe.status,200);assert.equal(adivinhe.data.jogo.respostaId,undefined);assert.equal(adivinhe.data.jogo.limite,6);
 const quiz=await post('jogador',{acao:'jogo',modo:'quiz'});assert.equal(quiz.status,200);assert.equal(quiz.data.jogo.questoes,undefined);assert.equal(quiz.data.jogo.pergunta.opcoes.length,4);
 const respondido=await post('jogador',{acao:'jogo',modo:'quiz',versao:0,tituloId:quiz.data.jogo.pergunta.opcoes[0]});assert.equal(respondido.data.jogo.indice,1);
 assert.equal((await post('jogador',{acao:'jogo',modo:'quiz',versao:0,tituloId:quiz.data.jogo.pergunta.opcoes[0]})).status,409);
 const torneio=await post('jogador',{acao:'jogo',modo:'torneio'});assert.equal(torneio.status,200);assert.equal(torneio.data.jogo.par.length,2);
});
test('Tier compartilhável devolve apenas snapshot e rejeita duplicatas',async()=>{
 assert.equal((await post('jogador',{acao:'jogo',modo:'tier',tiers:{S:['1'],A:['1']}})).status,400);
 const salvo=await post('jogador',{acao:'jogo',modo:'tier',tiers:{S:['1'],A:['2'],B:[],C:[],D:[]}});assert.equal(salvo.status,200);
 const tier=await get('pessoa-b','tier',`&id=${salvo.data.jogo.id}`);assert.equal(tier.status,200);assert.deepEqual(Object.keys(tier.data.tier).sort(),['id','tiers']);assert.equal(tier.data.tier.tiers.S[0],'1');
});
test('Acompanhamento persiste status, episódios e nota sem expor a coleção de outra pessoa',async()=>{
 await get('colecionador-a');await get('colecionador-b');
 const payload={acao:'acompanhamento',tituloId:'3',situacao:'assistindo',episodiosVistos:7,nota:9};
 const salvo=await post('colecionador-a',payload);assert.equal(salvo.status,200);
 assert.equal(salvo.data.item.situacao,'assistindo');assert.equal(salvo.data.item.episodiosVistos,7);assert.equal(salvo.data.item.nota,9);
 assert.equal(Number.isFinite(Date.parse(salvo.data.item.criadoEm)),true);
 const repetido=await post('colecionador-a',payload);assert.equal(repetido.status,200);assert.equal(repetido.data.item.criadoEm,salvo.data.item.criadoEm);
 const estado=await get('colecionador-a');assert.deepEqual(estado.data.minhaLista,['3']);assert.equal(estado.data.colecao.length,1);assert.equal(estado.data.colecao[0].nota,9);
 const outro=await get('colecionador-b');assert.deepEqual(outro.data.colecao,[]);
 assert.equal(outro.data.membros.find(m=>m.id==='colecionador-a').colecao,undefined);
 const concluido=await post('colecionador-a',{...payload,situacao:'concluido',episodiosVistos:7,nota:null});
 assert.equal(concluido.status,200);assert.equal(concluido.data.item.episodiosVistos,28);assert.equal(concluido.data.item.nota,null);
 const alterado=await post('colecionador-b',{...payload,usuarioId:'colecionador-a',episodiosVistos:2,nota:5});assert.equal(alterado.status,200);
 assert.equal((await get('colecionador-a')).data.colecao[0].nota,null);
 assert.equal((await get('colecionador-b')).data.colecao[0].nota,5);
});
test('Acompanhamento rejeita entradas inválidas, respeita total conhecido e aceita títulos em andamento',async()=>{
 await get('validacao-colecao');
 const payload={acao:'acompanhamento',tituloId:'3',situacao:'planejado',episodiosVistos:0,nota:null};
 for(const invalido of [{situacao:'admin'},{situacao:null},{situacao:1},{episodiosVistos:-1},{episodiosVistos:29},{episodiosVistos:1.5},{episodiosVistos:'1'},{nota:0},{nota:11},{nota:8.5},{nota:'8'},{nota:undefined}]){
  const resultado=await post('validacao-colecao',{...payload,...invalido});assert.equal(resultado.status,400,JSON.stringify(invalido));
 }
 assert.equal((await post('validacao-colecao',{...payload,tituloId:'inexistente'})).status,404);
 assert.equal((await post('validacao-colecao',{...payload,tituloId:'2',situacao:'assistindo',episodiosVistos:1200})).status,200);
 assert.equal((await post('validacao-colecao',{...payload,tituloId:'2',episodiosVistos:100001})).status,400);
 assert.equal((await post('validacao-colecao',{...payload,tituloId:'2',episodiosVistos:100000})).status,200);
});
test('Adicionar e remover explicitamente são idempotentes e preservam o acompanhamento salvo',async()=>{
 await get('lista-explicita');
 for(let i=0;i<2;i++)assert.equal((await post('lista-explicita',{acao:'lista',tituloId:'4',adicionado:true})).data.adicionado,true);
 const inicial=(await get('lista-explicita')).data.colecao;assert.equal(inicial.length,1);assert.equal(inicial[0].situacao,'planejado');assert.equal(inicial[0].episodiosVistos,0);assert.equal(inicial[0].nota,null);
 await post('lista-explicita',{acao:'acompanhamento',tituloId:'4',situacao:'pausado',episodiosVistos:12,nota:8});
 await post('lista-explicita',{acao:'lista',tituloId:'4',adicionado:true});
 const salvo=(await get('lista-explicita')).data.colecao[0];assert.equal(salvo.episodiosVistos,12);assert.equal(salvo.nota,8);assert.equal(salvo.criadoEm,inicial[0].criadoEm);
 assert.equal((await post('lista-explicita',{acao:'lista',tituloId:'4',adicionado:'true'})).status,400);
 for(let i=0;i<2;i++)assert.equal((await post('lista-explicita',{acao:'lista',tituloId:'4',adicionado:false})).data.adicionado,false);
 assert.deepEqual((await get('lista-explicita')).data.colecao,[]);
 assert.equal((await post('lista-explicita',{acao:'lista',tituloId:'4'})).data.adicionado,true);
 assert.equal((await post('lista-explicita',{acao:'lista',tituloId:'4'})).data.adicionado,false);
});
