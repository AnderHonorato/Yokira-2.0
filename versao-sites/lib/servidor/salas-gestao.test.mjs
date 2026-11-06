import assert from 'node:assert/strict';
import {test} from 'node:test';
import {sqlite,db,u,criar,entrar,mutarSala,obterSala,obterSalas,lote} from './salas-fixture.mjs';
const encerrar=(i,salaId)=>mutarSala(db,u(i),{acao:'sala-encerrar',salaId});
const rejeita=status=>e=>e.status===status;
test('suspender convidado libera vaga e reativar não restaura associação automaticamente',async()=>{
 const s=await criar(1);await entrar(2,s.convite);
 sqlite.exec("update usuarios set suspenso=1 where id='u2'");
 assert.equal((await obterSala(db,u(1),s.salaId)).participantes,1);
 assert.equal(sqlite.prepare('select ativo from sala_membros where sala_id=? and usuario_id=?').get(s.salaId,'u2').ativo,0);
 await entrar(3,s.convite);assert.equal((await obterSala(db,u(3),s.salaId)).participantes,2);
 sqlite.exec("update usuarios set suspenso=0 where id='u2'");
 await assert.rejects(()=>obterSala(db,u(2),s.salaId),rejeita(404));
 await assert.rejects(()=>entrar(2,s.convite),rejeita(409));
});
test('suspensão do dono pausa acesso mas preserva sua gestão após reativação',async()=>{
 const s=await criar(4);await entrar(5,s.convite);
 sqlite.exec("update usuarios set suspenso=1 where id='u4'");
 await assert.rejects(()=>obterSala(db,u(5),s.salaId),rejeita(404));
 await assert.rejects(()=>encerrar(4,s.salaId),rejeita(403));
 sqlite.exec("update usuarios set suspenso=0 where id='u4'");
 assert.equal((await obterSala(db,u(4),s.salaId)).participantes,2);
 await encerrar(4,s.salaId);
});
test('dono gerencia e encerra cinco salas indisponíveis sem liberar mídia ou conversa',async()=>{
 const salas=[];for(let i=0;i<5;i++)salas.push(await criar(6,'grupo'));
 await entrar(7,salas[0].convite);await assert.rejects(()=>criar(6),rejeita(403));
 sqlite.exec("update episodios set publicado=0 where id='ep'");
 const lista=(await obterSalas(db,u(6))).salas;
 assert.equal(lista.length,5);assert.ok(lista.every(s=>s.propria&&s.disponivel===false));
 assert.ok(lista.every(s=>!('convite' in s)&&!('episodio' in s)&&!('mensagens' in s)));
 assert.equal((await obterSalas(db,u(7))).salas.length,0);
 await assert.rejects(()=>obterSala(db,u(6),salas[0].salaId),rejeita(404));
 await assert.rejects(()=>encerrar(7,salas[0].salaId),rejeita(403));
 await encerrar(6,salas[0].salaId);assert.equal((await obterSalas(db,u(6))).salas.length,4);
 sqlite.exec("update episodios set publicado=1 where id='ep'");
 await criar(6);assert.equal((await obterSalas(db,u(6))).salas.length,5);
});
test('dono sem associação ativa ainda pode encerrar, com suspensão concorrente revalidada',async()=>{
 const s=await criar(8);sqlite.prepare('update sala_membros set ativo=0 where sala_id=?').run(s.salaId);
 const lista=(await obterSalas(db,u(8))).salas;assert.equal(lista.find(x=>x.id===s.salaId).disponivel,false);
 lote.antes=()=>{lote.antes=()=>{};sqlite.exec("update usuarios set suspenso=1 where id='u8'");};
 await assert.rejects(()=>encerrar(8,s.salaId),rejeita(403));
 assert.equal(sqlite.prepare('select encerrada from salas where id=?').get(s.salaId).encerrada,0);
 sqlite.exec("update usuarios set suspenso=0 where id='u8'");await encerrar(8,s.salaId);
 assert.equal((await obterSalas(db,u(8))).salas.length,0);
});
