import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys=ON');
const pasta = new URL('../../drizzle/', import.meta.url);
for (const arquivo of readdirSync(pasta).filter(a => a.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL(arquivo,pasta),'utf8'));
class Prepared {
    constructor(query, params=[]) { this.query=query; this.params=params; }
    bind(...params) { return new Prepared(this.query, params); }
    async raw() { const stmt=sqlite.prepare(this.query); stmt.setReturnArrays(true); return stmt.all(...this.params); }
    async all() { const results=sqlite.prepare(this.query).all(...this.params); return { success:true, results, meta:{} }; }
    async run() { const result=sqlite.prepare(this.query).run(...this.params); return {success:true, results:[], meta:{changes:Number(result.changes)}}; }
}
globalThis.__temporadasEnv = {DB:{ prepare(query) {return new Prepared(query);}, async batch(stmts) {sqlite.exec('BEGIN'); try { const results=[];for(const stmt of stmts) results.push(await stmt.all());sqlite.exec('COMMIT');return results;} catch(erro) {sqlite.exec('ROLLBACK');throw erro;} } }};
registerHooks({resolve(specifier,context,next) {
    if (specifier==='cloudflare:workers') return {url:'data:text/javascript,export const env=globalThis.__temporadasEnv',shortCircuit:true};
    try {return next(specifier,context);} catch(erro) { if(specifier.startsWith('.')) for(const suffix of ['.ts','/index.ts']) {const url=new URL(specifier+suffix,context.parentURL);if(existsSync(url))return next(url.href,context);}throw erro; }
}});
const {getDb}=await import('../../db/index.ts');
const {salvarTemporada,salvarEpisodio,obterTemporadasAdmin,obterEpisodiosPublicos}=await import('./temporadas.ts');
const {validarEpisodio}=await import('./validacao-temporadas.ts');
const db=getDb();
sqlite.prepare('insert into usuarios(id,nome,papel,criado_em) values(?,?,?,?)').run('admin','Admin','administrador',1);
sqlite.prepare('insert into usuarios(id,nome,papel,criado_em) values(?,?,?,?)').run('editor','Editor','editor',1);
const admin={id:'admin',papel:'administrador',suspenso:false};
const motivo='Cadastro e revisão de episódios.';
const base={tituloId:'1',numero:1,titulo:'O começo',sinopse:'Um novo começo.',duracao:24,videoUrl:'https://cdn.example.test/episodio.mp4',poster:'/arte/episodio.webp',publicado:true,estreiaEm:null,arquivado:false,motivo};
let temporadaId;let episodioId;

test('administrador cadastra temporadas e episódios, demais papéis não editam ou leem rascunhos',async()=>{
    for(const papel of ['membro','editor','moderador']) {
        await assert.rejects(()=>salvarTemporada(db,{...admin,papel},{tituloId:'1',numero:1,nome:'Primeira temporada',motivo}),e=>e.status===403);
        await assert.rejects(()=>obterTemporadasAdmin(db,{...admin,papel},'1'),e=>e.status===403);
    }
    await assert.rejects(()=>salvarTemporada(db,{...admin,suspenso:true},{tituloId:'1',numero:1,nome:'Primeira temporada',motivo}),e=>e.status===403);
    temporadaId=(await salvarTemporada(db,admin,{tituloId:'1',numero:1,nome:'Primeira temporada',motivo})).id;
    episodioId=(await salvarEpisodio(db,admin,{...base,temporadaId})).id;
    const publico=await obterEpisodiosPublicos(db,'1');
    assert.equal(publico.temporadas[0].id,temporadaId);assert.equal(publico.episodios[0].id,episodioId);
    assert.equal(publico.episodios[0].videoUrl,base.videoUrl);
    assert.equal(sqlite.prepare("select count(*) total from registros_moderacao where acao in ('salvar-temporada','salvar-episodio')").get().total,2);
});
test('rascunho, estreia futura, temporada arquivada e pai oculto nunca expõem URL de reprodução',async()=>{
    const rascunho=await salvarEpisodio(db,admin,{...base,temporadaId,numero:2,titulo:'Em produção',publicado:false,videoUrl:''});
    const futuro=await salvarEpisodio(db,admin,{...base,temporadaId,numero:3,titulo:'Em breve',estreiaEm:Date.now()+86400000});
    assert.deepEqual((await obterEpisodiosPublicos(db,'1')).episodios.map(e=>e.id),[episodioId]);
    assert.equal((await obterTemporadasAdmin(db,admin,'1')).episodios.length,3);
    await salvarTemporada(db,admin,{id:temporadaId,tituloId:'1',numero:1,nome:'Primeira temporada',arquivado:true,motivo});
    assert.equal((await obterEpisodiosPublicos(db,'1')).episodios.length,0);
    await salvarTemporada(db,admin,{id:temporadaId,tituloId:'1',numero:1,nome:'Primeira temporada',arquivado:false,motivo});
    sqlite.prepare('insert into catalogo_disponibilidade(titulo_id,oculto) values(?,1)').run('1');
    await assert.rejects(()=>obterEpisodiosPublicos(db,'1'),e=>e.status===404);
    sqlite.prepare('update catalogo_disponibilidade set oculto=0 where titulo_id=?').run('1');
    await salvarEpisodio(db,admin,{...base,id:futuro.id,temporadaId,numero:3,estreiaEm:Date.now()-1000});
    assert.equal((await obterEpisodiosPublicos(db,'1')).episodios.length,2);
    assert.equal((await obterTemporadasAdmin(db,admin,'1')).episodios.find(e=>e.id===rascunho.id).publicado,false);
});
test('edição e arquivamento preservam identidades, datas e dados de acompanhamento',async()=>{
    sqlite.prepare('insert into progresso(usuario_id,titulo_id,segundos,atualizado_em) values(?,?,?,?)').run('admin','1',90,1);
    const criado=sqlite.prepare('select criado_em from episodios where id=?').get(episodioId).criado_em;
    await salvarEpisodio(db,admin,{...base,id:episodioId,temporadaId,titulo:'Revisado',arquivado:true});
    assert.equal((await obterEpisodiosPublicos(db,'1')).episodios.some(e=>e.id===episodioId),false);
    await salvarEpisodio(db,admin,{...base,id:episodioId,temporadaId,titulo:'Restaurado'});
    assert.equal((await obterEpisodiosPublicos(db,'1')).episodios.find(e=>e.id===episodioId).titulo,'Restaurado');
    assert.equal(sqlite.prepare('select criado_em from episodios where id=?').get(episodioId).criado_em,criado);
    assert.equal(sqlite.prepare('select segundos from progresso where usuario_id=? and titulo_id=?').get('admin','1').segundos,90);
});
test('revalidação SQL bloqueia administrador revogado, sem alteração ou auditoria',async()=>{
    const antes=sqlite.prepare('select count(*) total from registros_moderacao').get().total;
    const antigoAdmin={...admin,id:'editor'};
    await assert.rejects(()=>salvarEpisodio(db,antigoAdmin,{...base,temporadaId,numero:10}),e=>e.status===403);
    await assert.rejects(()=>salvarTemporada(db,antigoAdmin,{tituloId:'1',numero:10,nome:'Invasão',motivo}),e=>e.status===403);
    await assert.rejects(()=>obterTemporadasAdmin(db,antigoAdmin,'1'),e=>e.status===403);
    assert.equal(sqlite.prepare('select count(*) total from registros_moderacao').get().total,antes);
    assert.equal(sqlite.prepare('select count(*) total from episodios where numero=10').get().total,0);
});
test('vídeos exigem URL segura e publicação exige vídeo; duplicação e associação cruzada são bloqueadas',async()=>{
    for(const videoUrl of ['http://example.test/video','//hostil.test/video','javascript:alert(1)','data:video/mp4;base64,eA==','https://user:senha@example.test/video','/\\hostil.test/video','/%2f%2fhostil.test/video','/arte/%5cvideo.mp4']) {
        assert.throws(()=>validarEpisodio({...base,videoUrl}));
    }
    assert.equal(validarEpisodio({...base,videoUrl:'/midia/video.mp4'}).videoUrl,'/midia/video.mp4');
    assert.throws(()=>validarEpisodio({...base,videoUrl:''}),/vídeo/);
    assert.throws(()=>validarEpisodio({...base,estreiaEm:'data inválida'}),/Data/);
    assert.throws(()=>validarEpisodio({...base,estreiaEm:Infinity}),/Data/);
    assert.throws(()=>validarEpisodio({...base,estreiaEm:'2026-02-30T10:00:00Z'}),/Data/);
    await assert.rejects(()=>salvarEpisodio(db,admin,{...base,temporadaId}),e=>e.status===409);
    await assert.rejects(()=>salvarEpisodio(db,admin,{...base,tituloId:'2',temporadaId}),e=>e.status===404);
    await assert.rejects(()=>salvarEpisodio(db,admin,{...base,id:episodioId,tituloId:'2',temporadaId:null}),/temporada/);
    await assert.rejects(()=>salvarTemporada(db,admin,{tituloId:'inexistente',numero:1,nome:'Ausente',motivo}),e=>e.status===404);
    assert.throws(()=>sqlite.prepare('insert into episodios(id,titulo_id,temporada_id,numero,titulo,duracao,criado_em,atualizado_em) values(?,?,?,?,?,?,?,?)').run('cruzado','2',temporadaId,1,'Falha',24,1,1),/FOREIGN KEY/);
});
test('filmes usam vídeo único sem temporada e validação pública protege dados fora do contrato',async()=>{
    const {obterAcervo}=await import('./catalogo-administrativo.ts');
    const filme=(await obterAcervo(db,true)).catalogo.find(t=>t.tipo==='Filme');assert.ok(filme);
    const video=await salvarEpisodio(db,admin,{...base,tituloId:filme.id,temporadaId:null,duracao:100});
    assert.equal((await obterEpisodiosPublicos(db,filme.id)).episodios[0].id,video.id);
    await assert.rejects(()=>salvarTemporada(db,admin,{tituloId:filme.id,numero:1,nome:'Inválida',motivo}),/Filmes/);
    await assert.rejects(()=>salvarEpisodio(db,admin,{...base,tituloId:filme.id,temporadaId:null,numero:2}),/único/);
    sqlite.prepare('update episodios set video_url=? where id=?').run('javascript:alert(1)',video.id);
    assert.equal((await obterEpisodiosPublicos(db,filme.id)).episodios.length,0);
});

test('ordem pública mantém sequência completa de cada temporada e respeita reordenação',async()=>{
    const segunda=(await salvarTemporada(db,admin,{tituloId:'1',numero:2,nome:'Segunda temporada',ordem:2,motivo})).id;
    const epSegunda=(await salvarEpisodio(db,admin,{...base,temporadaId:segunda,numero:1})).id;
    const primeiro=(await obterEpisodiosPublicos(db,'1')).episodios;
    assert.equal(primeiro[0].id,episodioId);
    assert.equal(primeiro.at(-1).id,epSegunda);
    assert.ok(primeiro.findIndex(e=>e.temporadaId===temporadaId && e.numero===3)<primeiro.findIndex(e=>e.temporadaId===segunda));
    await salvarTemporada(db,admin,{id:segunda,tituloId:'1',numero:2,nome:'Segunda temporada',ordem:1,motivo});
    await salvarTemporada(db,admin,{id:temporadaId,tituloId:'1',numero:1,nome:'Primeira temporada',ordem:2,motivo});
    assert.equal((await obterEpisodiosPublicos(db,'1')).episodios[0].id,epSegunda);
});
