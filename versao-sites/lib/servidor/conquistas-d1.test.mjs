import assert from 'node:assert/strict';
import {test} from 'node:test';
import {SQLiteAsyncDialect} from 'drizzle-orm/sqlite-core';
import {sqlite,db,u} from './salas-fixture.mjs';
const {sincronizarConquistas,listarConquistas}=await import('./conquistas.ts');
const {listarNotificacoes,verNotificacoes}=await import('./notificacoes.ts');
test('consultas de conquistas e histórico respeitam as 100 variáveis do D1',async()=>{
 const dialeto=new SQLiteAsyncDialect();
 for(const consulta of sincronizarConquistas('conta-d1'))assert.ok(dialeto.sqlToQuery(consulta).params.length<=100);
 const preparar=db.$client.prepare;
 let maior=0;
 db.$client.prepare=function(comando){
  const preparado=preparar.call(this,comando),vincular=preparado.bind;
  preparado.bind=function(...params){maior=Math.max(maior,params.length);assert.ok(params.length<=100,`Consulta com ${params.length} variáveis`);return vincular.apply(this,params);};
  return preparado;
 };
 try{
  const hall=await listarConquistas(db,u(0));
  assert.equal(hall.conquistas.length,20);
  assert.equal(hall.conquistas.find(c=>c.badgeId==='boas-vindas').progresso,1);
  assert.ok(hall.conquistas.find(c=>c.badgeId==='boas-vindas').obtidaEm);
  const historico=await listarNotificacoes(db,u(0));
  assert.equal(historico.filter(n=>n.badgeId==='boas-vindas').length,1);
  const ids=[];
  for(let i=0;i<200;i++){
   const id=i.toString(16).padStart(32,'0');ids.push(id);
   sqlite.prepare("insert into notificacoes(id,usuario_id,evento,tipo,titulo,descricao,destino,criado_em) values(?,? ,?,'nivel','Teste D1','Histórico','/?p=perfil',1)").run(id,'u0','d1:'+i);
  }
  assert.equal((await verNotificacoes(db,u(0),{ids,ler:true})).eventos.length,200);
  assert.equal(sqlite.prepare("select count(*) n from notificacoes where usuario_id='u0' and evento like 'd1:%' and lida_em is not null").get().n,200);
  assert.equal((await verNotificacoes(db,u(0),{ids,ler:false,celebrar:true})).eventos.length,200);
  assert.equal((await verNotificacoes(db,u(0),{ids,celebrar:true})).eventos.length,0);
  assert.ok(maior<=100);
 }finally{db.$client.prepare=preparar;}
});
