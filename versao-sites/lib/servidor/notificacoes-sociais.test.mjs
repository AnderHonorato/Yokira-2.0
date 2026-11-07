import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { sqlite, usuario, antesEscrita, limpar } from './chat-global-fixture.mjs';
const { GET, POST } = await import('../../app/api/yokira/route.ts');
const origem='https://yokira.test';
async function api(i,acao,dados) {
 const headers=i===null?{}:{'oai-authenticated-user-id':usuario(i).id};
 const resposta=dados===undefined?await GET(new Request(`${origem}/api/yokira?acao=${acao}`,{headers}))
  :await POST(new Request(`${origem}/api/yokira`,{method:'POST',headers:{...headers,origin:origem,'content-type':'application/json'},body:JSON.stringify({acao,...dados})}));
 return {status:resposta.status,dados:await resposta.json()};
}
const amizade=(i,operacao,alvo)=>api(i,'amizade',{operacao,alvoId:usuario(alvo).id});
async function sociais(i) { const r=await api(i,'notificacoes');assert.equal(r.status,200);return r.dados.notificacoes.filter(n=>n.tipo==='amizade'); }
const ler=(i,ids,dados={})=>api(i,'notificacoes-ver',{ids,ler:true,...dados});
beforeEach(()=>{
 limpar();sqlite.exec('delete from notificacoes_sociais;delete from notificacoes;delete from amizades;delete from bloqueios_sociais;delete from conquistas_destaques;delete from conquistas_usuario');
 sqlite.exec('update usuarios set suspenso=0;update perfis_sociais set publico=1');
});
test('API registra pedido privado uma vez e repetição ou pedido cruzado não duplicam nem notificam outra pessoa',async()=>{
 assert.equal((await api(null,'notificacoes')).status,401);
 assert.equal((await amizade(2,'solicitar',3)).status,200);
 assert.equal((await amizade(2,'solicitar',3)).status,200);
 assert.equal((await amizade(3,'solicitar',2)).status,200);
 const lista=await sociais(3);assert.equal(lista.length,1);assert.equal(lista[0].titulo,'Pedido de amizade recebido');
 assert.match(lista[0].descricao,/Pessoa 2/);assert.equal(lista[0].destino,'/?p=amizades&aba=recebidas');assert.equal(lista[0].lidaEm,null);
 assert.equal(lista[0].celebradaEm,lista[0].criadoEm);assert.match(lista[0].id,/^[a-f0-9]{32}$/);
 assert.deepEqual(await sociais(2),[]);assert.deepEqual(await sociais(4),[]);
 assert.equal(JSON.stringify(lista).includes('ciclo'),false);assert.equal(JSON.stringify(lista).includes('autor_id'),false);
});
test('aceite gera somente um evento para quem solicitou e nova relação preserva histórico com novo ciclo',async()=>{
 await amizade(2,'solicitar',3);
 assert.equal((await amizade(3,'aceitar',2)).status,200);assert.equal((await amizade(3,'aceitar',2)).status,200);
 const aceita=await sociais(2);assert.equal(aceita.length,1);assert.equal(aceita[0].titulo,'Pedido de amizade aceito');assert.match(aceita[0].descricao,/Pessoa 3/);
 assert.equal((await sociais(3)).length,1);
 await amizade(2,'remover',3);await amizade(2,'solicitar',3);
 assert.equal((await sociais(3)).length,2);assert.equal((await sociais(2)).length,1);
 assert.equal(sqlite.prepare('select count(distinct ciclo) n from notificacoes_sociais').get().n,2);
});
test('leitura é idempotente e isolada; pedido de celebração nunca retorna evento social',async()=>{
 await amizade(2,'solicitar',3);const [evento]=await sociais(3);
 assert.deepEqual((await ler(2,[evento.id])).dados.eventos,[]);
 assert.equal(sqlite.prepare('select lida_em from notificacoes_sociais').get().lida_em,null);
 assert.deepEqual((await api(3,'notificacoes-ver',{ids:[evento.id],celebrar:true})).dados.eventos,[]);
 assert.equal(sqlite.prepare('select lida_em from notificacoes_sociais').get().lida_em,null);
 const lida=await ler(3,[evento.id]);assert.equal(lida.dados.eventos.length,1);assert.equal(lida.dados.eventos[0].tipo,'amizade');
 const data=lida.dados.eventos[0].lidaEm;assert.ok(data>0);await ler(3,[evento.id]);assert.equal((await sociais(3))[0].lidaEm,data);
 const normais=(await api(3,'notificacoes')).dados.notificacoes.filter(n=>n.tipo!=='amizade');
 const celebradas=await api(3,'notificacoes-ver',{ids:normais.map(n=>n.id),celebrar:true});
 assert.ok(celebradas.dados.eventos.length>0);assert.ok(celebradas.dados.eventos.every(n=>n.tipo!=='amizade'));
 assert.deepEqual((await api(3,'notificacoes-ver',{ids:normais.map(n=>n.id),celebrar:true})).dados.eventos,[]);
});
test('bloqueio em qualquer direção e suspensão ocultam e impedem marcar o histórico social como lido',async()=>{
 await amizade(2,'solicitar',3);const [evento]=await sociais(3);
 await amizade(2,'bloquear',3);assert.deepEqual(await sociais(3),[]);assert.deepEqual((await ler(3,[evento.id])).dados.eventos,[]);
 assert.equal(sqlite.prepare('select lida_em from notificacoes_sociais').get().lida_em,null);
 await amizade(2,'desbloquear',3);assert.equal((await sociais(3)).length,1);
 sqlite.prepare('update usuarios set suspenso=1 where id=?').run(usuario(2).id);assert.deepEqual(await sociais(3),[]);
 assert.deepEqual((await ler(3,[evento.id])).dados.eventos,[]);
 sqlite.prepare('update usuarios set suspenso=0 where id=?').run(usuario(2).id);
 sqlite.prepare('update usuarios set suspenso=1 where id=?').run(usuario(3).id);assert.deepEqual(await sociais(3),[]);
 assert.deepEqual((await ler(3,[evento.id])).dados.eventos,[]);
 assert.equal(sqlite.prepare('select count(*) n from notificacoes_sociais').get().n,1);
});
test('corrida de suspensão impede pedido e gravação do evento no mesmo lote',async()=>{
 antesEscrita(()=>sqlite.prepare('update usuarios set suspenso=1 where id=?').run(usuario(3).id),'amizades');
 assert.equal((await amizade(2,'solicitar',3)).status,409);
 assert.equal(sqlite.prepare('select count(*) n from amizades').get().n,0);
 assert.equal(sqlite.prepare('select count(*) n from notificacoes_sociais').get().n,0);
});
test('erro ao registrar notificação reverte a amizade e nomes com email não vazam',async()=>{
 sqlite.exec("create trigger falha_notificacao before insert on notificacoes_sociais begin select raise(abort,'falha forçada');end");
 try {
  assert.equal((await amizade(2,'solicitar',3)).status,500);
  assert.equal(sqlite.prepare('select count(*) n from amizades').get().n,0);
 } finally {sqlite.exec('drop trigger falha_notificacao');}
 await amizade(23,'solicitar',3);const [evento]=await sociais(3);
 assert.match(evento.descricao,/Membro Yokira/);assert.equal(JSON.stringify(evento).includes('privado@email.test'),false);
 assert.equal(sqlite.prepare('pragma foreign_key_check').all().length,0);
});

test('migração com pedidos existentes preserva claims e notifica somente relações elegíveis',()=>{
 const legado=new DatabaseSync(':memory:');legado.exec('pragma foreign_keys=on');
 const pasta=new URL('../../drizzle/',import.meta.url);
 for(const arquivo of readdirSync(pasta).filter(a=>a.endsWith('.sql')&&a<'0018').sort())legado.exec(readFileSync(new URL(arquivo,pasta),'utf8'));
 for(const id of ['a','b','c','d'])legado.prepare('insert into usuarios(id,nome,criado_em) values(?,?,1)').run(id,id);
 legado.exec("insert into amizades values('a','b','a','pendente',11,11);insert into amizades values('c','d','c','pendente',12,12);update usuarios set suspenso=1 where id='d'");
 legado.exec("insert into notificacoes(id,usuario_id,evento,tipo,titulo,descricao,destino,criado_em,lida_em,celebrada_em) values('antiga','a','boas-vindas','conquista','Antes','Antes','/?p=perfil',7,8,9)");
 legado.exec(readFileSync(new URL('0018_notificacoes_sociais.sql',pasta),'utf8'));
 const evento=legado.prepare('select usuario_id,autor_id,tipo,criado_em,lida_em from notificacoes_sociais').get();
 assert.deepEqual({...evento},{usuario_id:'b',autor_id:'a',tipo:'pedido-amizade',criado_em:11,lida_em:null});
 assert.equal(legado.prepare('select count(distinct ciclo) n from amizades').get().n,2);
 assert.equal(legado.prepare('select count(*) n from amizades where length(ciclo)=32').get().n,2);
 assert.deepEqual({...legado.prepare("select lida_em,celebrada_em from notificacoes where id='antiga'").get()},{lida_em:8,celebrada_em:9});
 assert.equal(legado.prepare('pragma foreign_key_check').all().length,0);legado.close();
});
