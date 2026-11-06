import assert from 'node:assert/strict';
import {test,beforeEach} from 'node:test';
import {sqlite,db,usuario,imagem,antesEscrita,quantidade,limpar} from './chat-global-fixture.mjs';

const {listarChatGlobal}=await import('./chat-global.ts');
const {enviarChatGlobal}=await import('./chat-global-escrita.ts');
const {listarChatModeracao,moderarChatGlobal}=await import('./chat-global-moderacao.ts');
const {mutarSala}=await import('./salas.ts');
const enviar=(i,p={})=>enviarChatGlobal(db,usuario(i),{acao:'chat-global-enviar',corpo:'Olá, comunidade.',...p});
const publico=()=>listarChatGlobal(db,null);
const rejeita=(acao,status)=>assert.rejects(acao,e=>!status||e.status===status);
const criarSala=i=>mutarSala(db,usuario(i),{acao:'sala-criar',tituloId:'1',episodioId:'chat-ep',modo:'grupo'});
beforeEach(limpar);

test('texto literal, autor de perfil privado e DTO público sem dados privados',async()=>{
 const literal='<script>alert("oi")</script>',r=await enviar(23,{corpo:literal});
 assert.equal(r.ok,true);const p=await publico();assert.equal(typeof p.servidorEm,'number');
 assert.equal(p.mensagens.length,1);const m=p.mensagens[0];assert.equal(m.id,r.id);assert.equal(m.corpo,literal);
 assert.equal(m.autor.id,usuario(23).id);assert.equal(m.autor.nome,'Membro Yokira');assert.equal(m.autor.handle,'chat_pessoa_23');
 assert.equal(JSON.stringify(p).includes('privado@email.test'),false);
 for(const chave of ['email','bio','xp','criadoEm','suspenso','papel'])assert.equal(chave in m.autor,false);
 assert.equal(sqlite.prepare('select corpo from chat_mensagens where id=?').get(r.id).corpo,literal);
});
test('sessão antiga ou suspensa não permite enviar, inclusive revogação no lote SQL',async()=>{
 await rejeita(()=>enviarChatGlobal(db,{...usuario(2),suspenso:true},{corpo:'Suspenso'}),403);
 sqlite.prepare('update usuarios set suspenso=1 where id=?').run(usuario(2).id);
 try{await rejeita(()=>enviar(2),403);}finally{sqlite.prepare('update usuarios set suspenso=0 where id=?').run(usuario(2).id);}
 antesEscrita(()=>sqlite.prepare('update usuarios set suspenso=1 where id=?').run(usuario(3).id));
 try{await rejeita(()=>enviar(3),403);assert.equal(quantidade(),0);}finally{sqlite.prepare('update usuarios set suspenso=0 where id=?').run(usuario(3).id);}
});
test('texto exige conteúdo e limite; imagens externas, vídeo e combinações são rejeitados',async()=>{
 for(const corpo of ['', '   ','x'.repeat(1001)])await rejeita(()=>enviar(4,{corpo}));
 for(const url of ['https://externo.test/foto.png','/api/midia/video-id','data:image/png;base64,AAAA','/api/comunidade/imagens/nao-uuid'])await rejeita(()=>enviar(4,{imagem:url}));
 await rejeita(()=>enviar(4,{imagem:imagem(4),salaId:crypto.randomUUID()}));
 assert.equal(quantidade(),0);await enviar(4,{corpo:'x'.repeat(1000)});assert.equal(quantidade(),1);
});
test('somente imagem pronta do autor e finalidade chat pode ser vinculada',async()=>{
 const propria=imagem(5);
 for(const url of [imagem(6),imagem(5,'avatar'),imagem(5,'banner'),`/api/comunidade/imagens/${crypto.randomUUID()}`])await rejeita(()=>enviar(5,{corpo:'',imagem:url}));
 const r=await enviar(5,{corpo:'',imagem:propria});assert.equal((await publico()).mensagens[0].imagem,propria);
 assert.equal(sqlite.prepare('select imagem_id from chat_mensagens where id=?').get(r.id).imagem_id,propria.split('/').at(-1));
 const movida=imagem(7);antesEscrita(()=>sqlite.prepare('update chat_imagens set usuario_id=? where id=?').run(usuario(8).id,movida.split('/').at(-1)));
 await rejeita(()=>enviar(7,{imagem:movida}));assert.equal(quantidade(),1);
});
test('nonce estável elimina duplicação simultânea e colisão entre autores é negada',async()=>{
 const requisicaoId=crypto.randomUUID(),payload={requisicaoId,corpo:'Uma só mensagem.'};
 const resultados=await Promise.all([enviar(8,payload),enviar(8,payload)]);
 assert.equal(resultados[0].id,resultados[1].id);assert.equal(quantidade(),1);
 assert.equal((await enviar(8,payload)).id,resultados[0].id);
 await rejeita(()=>enviar(9,payload),409);await rejeita(()=>enviar(8,{...payload,corpo:'Outro conteúdo'}),409);assert.equal(quantidade(),1);
 await rejeita(()=>enviar(8,{requisicaoId:'nonce-invalido'}));
});
test('apenas dono compartilha sala; DTO não contém convite privado nem URL do vídeo',async()=>{
 const s=await criarSala(10);await rejeita(()=>enviar(11,{salaId:s.salaId}));
 await enviar(10,{corpo:'',salaId:s.salaId});let p=await publico();assert.equal(p.mensagens[0].sala.id,s.salaId);
 for(const segredo of [s.convite,'https://cdn.test/segredo.mp4','Episódio reservado'])assert.equal(JSON.stringify(p).includes(segredo),false);
 sqlite.exec("update episodios set publicado=0 where id='chat-ep'");
 try{await rejeita(()=>enviar(10,{salaId:s.salaId}));p=await publico();assert.ok(!p.mensagens[0]?.sala||p.mensagens[0].sala.encerrada);}finally{sqlite.exec("update episodios set publicado=1 where id='chat-ep'");}
 sqlite.prepare('insert into catalogo_disponibilidade(titulo_id,oculto) values(?,1)').run('1');
 try{p=await publico();assert.ok(!p.mensagens[0]?.sala||p.mensagens[0].sala.encerrada);}finally{sqlite.exec("delete from catalogo_disponibilidade where titulo_id='1'");}
});
test('transferência concorrente do dono da sala não deixa mensagem órfã publicada',async()=>{
 const s=await criarSala(12);antesEscrita(()=>sqlite.prepare('update salas set dono_id=? where id=?').run(usuario(13).id,s.salaId));
 await rejeita(()=>enviar(12,{salaId:s.salaId}));assert.equal(quantidade(),0);
});
test('janela pública limita 60 recentes, ordena de modo estável e omite ocultos/suspensos',async()=>{
 const inserir=sqlite.prepare('insert into chat_mensagens(id,autor_id,corpo,oculto,criado_em) values(?,?,?,?,?)');
 for(let i=0;i<75;i++)inserir.run(`chat-${String(i).padStart(3,'0')}`,usuario(14).id,`Mensagem ${i}`,0,1000+i);
 inserir.run('chat-oculta',usuario(14).id,'Oculta',1,99999);inserir.run('chat-suspensa',usuario(15).id,'Suspensa',0,99999);
 sqlite.prepare('update usuarios set suspenso=1 where id=?').run(usuario(15).id);
 try{const p=await publico();assert.equal(p.mensagens.length,60);assert.equal(p.mensagens[0].id,'chat-015');assert.equal(p.mensagens.at(-1).id,'chat-074');}finally{sqlite.prepare('update usuarios set suspenso=0 where id=?').run(usuario(15).id);}
 sqlite.exec('delete from chat_mensagens');for(const id of ['chat-c','chat-a','chat-b'])inserir.run(id,usuario(14).id,id,0,2000);
 assert.deepEqual((await publico()).mensagens.map(m=>m.id),['chat-a','chat-b','chat-c']);
});
test('bloqueio nos dois sentidos filtra autores para leitor autenticado',async()=>{
 await enviar(16);await enviar(17);
 for(const [a,b] of [[16,17],[17,16]]){
  sqlite.prepare('insert into bloqueios_sociais(autor_id,alvo_id,criado_em) values(?,?,1)').run(usuario(a).id,usuario(b).id);
  try{assert.equal((await listarChatGlobal(db,usuario(16))).mensagens.some(m=>m.autor.id===usuario(17).id),false);}finally{sqlite.exec('delete from bloqueios_sociais');}
 }
 assert.equal((await publico()).mensagens.length,2);
});
test('moderação exige papel atual, motivo e auditoria; editar texto é exclusivo admin',async()=>{
 const {id}=await enviar(18),p={id,oculto:true,motivo:'Moderação do conteúdo.'};
 await rejeita(()=>listarChatModeracao(db,usuario(18)),403);await rejeita(()=>moderarChatGlobal(db,usuario(18),p),403);
 await rejeita(()=>moderarChatGlobal(db,usuario(1),{...p,motivo:'curto'}));
 await rejeita(()=>moderarChatGlobal(db,usuario(1),{...p,corpo:'Edição indevida'}),403);
 await moderarChatGlobal(db,usuario(1),p);assert.equal((await publico()).mensagens.length,0);
 assert.equal((await listarChatModeracao(db,usuario(1),'Olá')).mensagens.some(m=>m.id===id),true);
 await moderarChatGlobal(db,usuario(0),{...p,oculto:false,corpo:'Texto revisado'});assert.equal((await publico()).mensagens[0].corpo,'Texto revisado');
 const auditorias=sqlite.prepare('select autor_id,motivo from registros_moderacao where alvo_id=?').all(id);assert.equal(auditorias.length,2);assert.ok(auditorias.every(a=>a.motivo===p.motivo));
 sqlite.prepare("update usuarios set papel='membro' where id=?").run(usuario(1).id);
 try{await rejeita(()=>listarChatModeracao(db,usuario(1)),403);await rejeita(()=>moderarChatGlobal(db,usuario(1),p),403);}finally{sqlite.prepare("update usuarios set papel='moderador' where id=?").run(usuario(1).id);}
});
test('revogação concorrente de administração impede edição e auditoria de sucesso',async()=>{
 const {id}=await enviar(19);antesEscrita(()=>sqlite.prepare("update usuarios set papel='membro' where id=?").run(usuario(0).id));
 try{await rejeita(()=>moderarChatGlobal(db,usuario(0),{id,oculto:false,corpo:'Não pode persistir',motivo:'Permissão administrativa antiga.'}),403);assert.equal((await publico()).mensagens[0].corpo,'Olá, comunidade.');assert.equal(sqlite.prepare('select count(*) n from registros_moderacao where alvo_id=?').get(id).n,0);}finally{sqlite.prepare("update usuarios set papel='administrador' where id=?").run(usuario(0).id);}
});

test('limite de oito envios é atômico e repetir nonce aceito não consome outra vaga',async()=>{
 const agora=Date.now,instante=agora();Date.now=()=>instante;
 try{
  const payloads=Array.from({length:16},(_,i)=>({requisicaoId:crypto.randomUUID(),corpo:`Envio ${i}`}));
  const resultados=await Promise.allSettled(payloads.map(p=>enviar(20,p)));
  assert.equal(resultados.filter(r=>r.status==='fulfilled').length,8);assert.equal(quantidade(),8);
  assert.ok(resultados.filter(r=>r.status==='rejected').every(r=>r.reason.status===429));
  const aceito=resultados.findIndex(r=>r.status==='fulfilled');assert.equal((await enviar(20,payloads[aceito])).id,resultados[aceito].value.id);
  assert.equal(quantidade(),8);
 }finally{Date.now=agora;}
});
