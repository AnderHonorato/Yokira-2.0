import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
function banco(){const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');const pasta=new URL('../../drizzle/',import.meta.url);for(const arquivo of readdirSync(pasta).filter(p=>p.endsWith('.sql')).sort())db.exec(readFileSync(new URL(arquivo,pasta),'utf8'));return db;}
test('migração mantém um voto por pessoa e publicação, mesmo em repetições',()=>{
 const db=banco();
 db.prepare('INSERT INTO usuarios(id,nome,criado_em) VALUES(?,?,?)').run('a','Pessoa A',1);
 db.prepare('INSERT INTO usuarios(id,nome,criado_em) VALUES(?,?,?)').run('b','Pessoa B',1);
 db.prepare('INSERT INTO publicacoes(id,autor_id,tipo,titulo,corpo,criado_em) VALUES(?,?,?,?,?,?)').run('p','a','lista','Top animes','Vote aqui',1);
 db.prepare('INSERT INTO opcoes(publicacao_id,titulo_id) VALUES(?,?)').run('p','t1');db.prepare('INSERT INTO opcoes(publicacao_id,titulo_id) VALUES(?,?)').run('p','t2');
 const votar=db.prepare('INSERT INTO votos(publicacao_id,usuario_id,titulo_id) VALUES(?,?,?) ON CONFLICT(publicacao_id,usuario_id) DO UPDATE SET titulo_id=excluded.titulo_id');
 votar.run('p','a','t1');votar.run('p','a','t1');votar.run('p','a','t2');votar.run('p','b','t1');
 assert.equal(db.prepare('SELECT COUNT(*) as total FROM votos').get().total,2);
 assert.equal(db.prepare('SELECT titulo_id FROM votos WHERE publicacao_id=? AND usuario_id=?').get('p','a').titulo_id,'t2');
 assert.throws(()=>votar.run('inexistente','a','t1'),/FOREIGN KEY/);assert.throws(()=>votar.run('p','a','fora-da-lista'),/FOREIGN KEY/);
 db.close();
});
test('limite diário é atômico e dados pessoais usam chave por pessoa',()=>{
 const db=banco();
 const consumir=db.prepare('INSERT INTO limites(usuario_id,janela,quantidade) VALUES(?,?,1) ON CONFLICT(usuario_id,janela) DO UPDATE SET quantidade=limites.quantidade+1 WHERE limites.quantidade<3 RETURNING quantidade');
 assert.equal(consumir.get('a','gacha').quantidade,1);assert.equal(consumir.get('a','gacha').quantidade,2);assert.equal(consumir.get('a','gacha').quantidade,3);assert.equal(consumir.get('a','gacha'),undefined);
 assert.equal(consumir.get('b','gacha').quantidade,1);
 db.prepare('INSERT INTO usuarios(id,nome,criado_em) VALUES(?,?,?)').run('a','A',1);
 db.prepare('INSERT INTO usuarios(id,nome,criado_em) VALUES(?,?,?)').run('b','B',1);
 const progresso=db.prepare('INSERT INTO progresso(usuario_id,titulo_id,segundos,atualizado_em) VALUES(?,?,?,?) ON CONFLICT(usuario_id,titulo_id) DO UPDATE SET segundos=excluded.segundos');
 progresso.run('a','t1',70,1);progresso.run('b','t1',10,1);progresso.run('a','t1',90,2);
 assert.equal(db.prepare('SELECT segundos FROM progresso WHERE usuario_id=? AND titulo_id=?').get('a','t1').segundos,90);
 assert.equal(db.prepare('SELECT segundos FROM progresso WHERE usuario_id=? AND titulo_id=?').get('b','t1').segundos,10);
 db.close();
});
