import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');
const pasta=new URL('../../drizzle/',import.meta.url);
for(const arquivo of readdirSync(pasta).filter(a=>a.endsWith('.sql')).sort())sqlite.exec(readFileSync(new URL(arquivo,pasta),'utf8'));
class Prepared {
 constructor(query,params=[]){this.query=query;this.params=params;}
 bind(...params){return new Prepared(this.query,params);}
 async raw(){const stmt=sqlite.prepare(this.query);stmt.setReturnArrays(true);return stmt.all(...this.params);}
 async all(){return {success:true,results:sqlite.prepare(this.query).all(...this.params),meta:{}};}
 async run(){const resultado=sqlite.prepare(this.query).run(...this.params);return {success:true,results:[],meta:{changes:Number(resultado.changes)}};}
}
globalThis.__fontesEnv={DB:{prepare(query){return new Prepared(query);},async batch(stmts){sqlite.exec('BEGIN');try{const results=[];for(const stmt of stmts)results.push(await stmt.all());sqlite.exec('COMMIT');return results;}catch(erro){sqlite.exec('ROLLBACK');throw erro;}}}};
registerHooks({resolve(specifier,context,next){
 if(specifier==='cloudflare:workers')return {url:'data:text/javascript,export const env=globalThis.__fontesEnv',shortCircuit:true};
 try{return next(specifier,context);}catch(erro){if(specifier.startsWith('.'))for(const suffix of ['.ts','/index.ts']){const url=new URL(specifier+suffix,context.parentURL);if(existsSync(url))return next(url.href,context);}throw erro;}
}});
const {getDb}=await import('../../db/index.ts');
const {salvarTemporada,salvarEpisodio,obterTemporadasAdmin,obterEpisodiosPublicos}=await import('./temporadas.ts');
const {validarFonteEpisodio}=await import('./validacao-fontes-episodio.ts');
const {anexarFontesEpisodios}=await import('./fontes-episodio.ts');
const db=getDb();const origem='https://yokira.com';const admin={id:'admin',papel:'administrador',suspenso:false};
sqlite.prepare('insert into usuarios(id,nome,papel,criado_em) values(?,?,?,?)').run('admin','Admin','administrador',1);
sqlite.prepare('insert into usuarios(id,nome,papel,criado_em) values(?,?,?,?)').run('membro','Membro','membro',1);
const motivo='Configuração dos servidores.';
const temporadaId=(await salvarTemporada(db,admin,{tituloId:'1',numero:1,nome:'Temporada 1',motivo})).id;
const base={tituloId:'1',temporadaId,numero:1,titulo:'Episódio teste',sinopse:'',duracao:24,videoUrl:'',poster:'',publicado:true,motivo};
const direto={nome:'Servidor próprio',tipo:'direto',url:'/midia/video.mp4',ordem:1,ativo:true};
const drive={nome:'Google Drive',tipo:'drive',url:'https://drive.google.com/file/d/ABcdef0123_-456/view?usp=sharing',ordem:2,ativo:true};
const embed={nome:'Outra nuvem',tipo:'incorporado',url:'https://player.provedor.com/embed/123',ordem:3,ativo:true};
let episodioId;

test('episódio oferece todas as fontes ativas, Drive normaliza preview e inativas ficam apenas no editor',async()=>{
 episodioId=(await salvarEpisodio(db,admin,{...base,fontes:[embed,direto,drive,{...direto,nome:'Reserva desativada',ordem:4,ativo:false}]},origem)).id;
 const publico=(await obterEpisodiosPublicos(db,'1',origem)).episodios[0];
 assert.equal(publico.id,episodioId);assert.deepEqual(publico.fontes.map(f=>f.nome),['Servidor próprio','Google Drive','Outra nuvem']);
 assert.equal(publico.fontes[1].url,'https://drive.google.com/file/d/ABcdef0123_-456/preview');
 assert.equal((await obterTemporadasAdmin(db,admin,'1')).episodios[0].fontes.length,4);
 assert.equal(sqlite.prepare('select video_url from episodios where id=?').get(episodioId).video_url,'/midia/video.mp4');
});
test('somente Drive ou embed publica sem fonte direta e preserva CHECK de migração anterior',async()=>{
 const criado=(await salvarEpisodio(db,admin,{...base,numero:2,fontes:[drive,embed]},origem)).id;
 const item=(await obterEpisodiosPublicos(db,'1',origem)).episodios.find(e=>e.id===criado);
 assert.equal(item.fontes.length,2);assert.equal(item.fontes[0].tipo,'drive');
 assert.equal(sqlite.prepare('select video_url from episodios where id=?').get(criado).video_url,item.fontes[0].url);
});
test('players incorporados rejeitam protocolos, credenciais, origem local e endereços reservados sem consultar rede',()=>{
 for(const url of ['http://player.provedor.com/e','//player.provedor.com/e','javascript:alert(1)','data:text/html,a','https://user:pass@player.provedor.com/e','https://yokira.com/embed','https://localhost/e','https://localhost./e','https://sub.localhost/e','https://127.1/e','https://2130706433/e','https://0x7f000001/e','https://10.0.0.1/e','https://100.64.0.1/e','https://169.254.169.254/e','https://172.16.3.4/e','https://192.168.0.1/e','https://[::1]/e','https://[::ffff:127.0.0.1]/e','https://player.internal/e','https://player.provedor.com:8443/e'])
  assert.throws(()=>validarFonteEpisodio({...embed,url},0,origem),url);
 assert.throws(()=>validarFonteEpisodio({...drive,url:'https://hostil.com/file/d/ABcdef0123_-456/view'},0,origem),/Drive/);
 assert.throws(()=>validarFonteEpisodio({...drive,url:'https://drive.google.com/file/d/x/view'},0,origem),/Drive/);
 assert.equal(validarFonteEpisodio({...direto,url:'/api/midia/uuid'},0,origem).url,'/api/midia/uuid');
});
test('remover ou desativar todas fontes exige rascunho, sem fallback para videoUrl antigo',async()=>{
 await assert.rejects(()=>salvarEpisodio(db,admin,{...base,id:episodioId,videoUrl:'/antigo.mp4',fontes:[]},origem),/Ative/);
 await assert.rejects(()=>salvarEpisodio(db,admin,{...base,id:episodioId,fontes:[{...direto,ativo:false}]},origem),/Ative/);
 await salvarEpisodio(db,admin,{...base,id:episodioId,publicado:false,fontes:[]},origem);
 assert.equal((await obterEpisodiosPublicos(db,'1',origem)).episodios.some(e=>e.id===episodioId),false);
 const item=(await obterTemporadasAdmin(db,admin,'1')).episodios.find(e=>e.id===episodioId);assert.equal(item.videoUrl,'');assert.equal(item.fontes.length,0);
});
test('rascunho, futuro, arquivo e título oculto não expõem fontes',async()=>{
 const id=(await salvarEpisodio(db,admin,{...base,numero:3,fontes:[embed],estreiaEm:Date.now()+86400000},origem)).id;
 assert.equal((await obterEpisodiosPublicos(db,'1',origem)).episodios.some(e=>e.id===id),false);
 await salvarEpisodio(db,admin,{...base,id,numero:3,fontes:[embed],arquivado:true},origem);
 assert.equal((await obterEpisodiosPublicos(db,'1',origem)).episodios.some(e=>e.id===id),false);
 await salvarEpisodio(db,admin,{...base,id,numero:3,fontes:[embed]},origem);
 sqlite.prepare('insert into catalogo_disponibilidade(titulo_id,oculto) values(?,1)').run('1');
 await assert.rejects(()=>obterEpisodiosPublicos(db,'1',origem),e=>e.status===404);
 sqlite.prepare('update catalogo_disponibilidade set oculto=0 where titulo_id=?').run('1');
 assert.equal((await obterEpisodiosPublicos(db,'1',origem)).episodios.some(e=>e.id===id),true);
});
test('autorização e colisão entre episódios revertem fontes, conteúdo e auditoria juntos',async()=>{
 const antes=sqlite.prepare('select count(*) total from registros_moderacao').get().total;
 await assert.rejects(()=>salvarEpisodio(db,{...admin,id:'membro'},{...base,id:episodioId,fontes:[direto]},origem),e=>e.status===403);
 assert.equal(sqlite.prepare('select count(*) total from registros_moderacao').get().total,antes);
 const fonteAlheia=sqlite.prepare('select id from episodio_fontes limit 1').get().id;
 await assert.rejects(()=>salvarEpisodio(db,admin,{...base,id:episodioId,titulo:'Não pode salvar',fontes:[{...direto,id:fonteAlheia}]},origem),e=>e.status===409);
 assert.equal(sqlite.prepare('select titulo from episodios where id=?').get(episodioId).titulo,base.titulo);
 assert.equal(sqlite.prepare('select count(*) total from registros_moderacao').get().total,antes);
});
test('legado funciona sem fontes persistidas e durante ausência da tabela nova',async()=>{
 const id=(await salvarEpisodio(db,admin,{...base,numero:4,videoUrl:'/legado.mp4'},origem)).id;
 const item=(await obterEpisodiosPublicos(db,'1',origem)).episodios.find(e=>e.id===id);
 assert.equal(item.fontes[0].tipo,'direto');assert.equal(item.fontes[0].url,'/legado.mp4');
 sqlite.exec('DROP TABLE episodio_fontes');
 const legado=(await anexarFontesEpisodios(db,[{id:'legado',videoUrl:'/legado.mp4'}],true,origem))[0];
 assert.equal(legado.fontes[0].url,'/legado.mp4');
});
