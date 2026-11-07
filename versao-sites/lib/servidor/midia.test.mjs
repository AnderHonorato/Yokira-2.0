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
    async all() { return { success:true, results:sqlite.prepare(this.query).all(...this.params), meta:{} }; }
    async run() { const result=sqlite.prepare(this.query).run(...this.params); return {success:true,results:[],meta:{changes:Number(result.changes)}}; }
}
const arquivos=new Map(); let aoPersistir; let ultimoRange;
const bucket={
    async put(chave,body) { assert.equal(typeof body.getReader,'function'); const bytes=new Uint8Array(await new Response(body).arrayBuffer()); arquivos.set(chave,bytes); if(aoPersistir) await aoPersistir(); return {}; },
    async delete(chave) { arquivos.delete(chave); },
    async head(chave) { return arquivos.has(chave) ? {} : null; },
    async get(chave,opcoes) { const bytes=arquivos.get(chave);if(!bytes)return null;ultimoRange=opcoes?.range;const range=intervaloMidia(ultimoRange?.get('range')||null,bytes.length);return {body:new Blob([range?bytes.slice(range.inicio,range.fim+1):bytes]).stream()}; }
};
globalThis.FixedLengthStream=class extends TransformStream { constructor() { super(); } };
globalThis.__midiaEnv={BUCKET:bucket,DB:{prepare(query){return new Prepared(query);},async batch(stmts){sqlite.exec('BEGIN');try{const result=[];for(const stmt of stmts)result.push(await stmt.all());sqlite.exec('COMMIT');return result;}catch(erro){sqlite.exec('ROLLBACK');throw erro;}}}};
registerHooks({resolve(specifier,context,next){
    if(specifier==='cloudflare:workers')return {url:'data:text/javascript,export const env=globalThis.__midiaEnv',shortCircuit:true};
    try{return next(specifier,context);}catch(erro){if(specifier.startsWith('.'))for(const suffix of ['.ts','/index.ts']){const url=new URL(specifier+suffix,context.parentURL);if(existsSync(url))return next(url.href,context);}throw erro;}
}});
const {getDb}=await import('../../db/index.ts');
const {enviarMidia,obterMidia}=await import('./midia.ts');
const {LIMITE_MIDIA,intervaloMidia,limitarFluxoMidia}=await import('./validacao-midia.ts');
const {POST}=await import('../../app/api/midia/route.ts');
const {GET,HEAD}=await import('../../app/api/midia/[id]/route.ts');
const db=getDb(),admin={id:'admin',papel:'administrador',suspenso:false};
sqlite.prepare('insert into usuarios(id,nome,papel,criado_em) values(?,?,?,?)').run('admin','Admin','administrador',1);
sqlite.prepare('insert into usuarios(id,nome,papel,criado_em) values(?,?,?,?)').run('editor','Editor','editor',1);
sqlite.prepare('insert into usuarios(id,nome,papel,criado_em) values(?,?,?,?)').run('reserva','Reserva','administrador',1);
function pedido(opcoes={}) { return new Request('https://yokira.test/api/midia',{method:'POST',headers:{origin:'https://yokira.test','oai-authenticated-user-id':'admin','content-type':'video/mp4','x-nome-arquivo':'episodio.mp4','x-tamanho-arquivo':'4',...opcoes.headers},body:opcoes.body||new Uint8Array([1,2,3,4]),duplex:'half'}); }
const ler=(id,headers={},usuario)=>obterMidia(db,bucket,new Request(`https://yokira.test/api/midia/${id}`,{headers}),id,usuario);
const rejeita=(promessa,status)=>assert.rejects(promessa,e=>e.status===status);
let video,imagem,episodio;
test('upload bruto persiste streaming e metadados, audita e não expõe chave ou identidade',async()=>{
    const resposta=await POST(pedido());assert.equal(resposta.status,201);video=await resposta.json();
    assert.deepEqual(Object.keys(video).sort(),['id','tamanho','tipo','url']);
    const linha=sqlite.prepare('select * from midia where id=?').get(video.id);assert.equal(linha.status,'pronto');assert.equal(linha.dono_id,'admin');assert.notEqual(linha.chave,video.id);
    assert.deepEqual([...arquivos.get(linha.chave)],[1,2,3,4]);assert.equal(sqlite.prepare("select count(*) total from registros_moderacao where acao='enviar-midia'").get().total,1);
    imagem=await enviarMidia(db,admin,bucket,pedido({headers:{'content-type':'image/png','x-nome-arquivo':'imagem.png'}}));
});
test('auth atual SQL, suspensão, CSRF, formatos e declaração de tamanho bloqueiam antes de persistir',async()=>{
    for(const usuario of [{...admin,papel:'membro'},{...admin,suspenso:true},{...admin,id:'editor'}])await rejeita(()=>enviarMidia(db,usuario,bucket,pedido()),403);
    for(const [headers,status] of [[{origin:'https://externo.test'},403],[{'content-type':'text/html'},415],[{'x-nome-arquivo':'arquivo.html'},415],[{'x-tamanho-arquivo':String(LIMITE_MIDIA+1)},413],[{'x-tamanho-arquivo':'0'},400]])assert.equal((await POST(pedido({headers}))).status,status);
    const ausente=pedido();ausente.headers.delete('x-tamanho-arquivo');assert.equal((await POST(ausente)).status,411);
    const anonimo=pedido();anonimo.headers.delete('oai-authenticated-user-id');assert.equal((await POST(anonimo)).status,401);
    globalThis.__midiaEnv.BUCKET=undefined;assert.equal((await POST(pedido())).status,503);globalThis.__midiaEnv.BUCKET=bucket;
});
test('contador real interrompe excesso, truncamento e quota 100MiB; falhas removem R2 e não auditam sucesso',async()=>{
    const antes=arquivos.size,auditoria=sqlite.prepare('select count(*) total from registros_moderacao').get().total;
    await rejeita(()=>enviarMidia(db,admin,bucket,pedido({headers:{'x-tamanho-arquivo':'3'}})),413);
    await rejeita(()=>enviarMidia(db,admin,bucket,pedido({headers:{'x-tamanho-arquivo':'5'}})),400);
    assert.equal(arquivos.size,antes);assert.equal(sqlite.prepare("select count(*) total from midia where status='falhou'").get().total,2);
    let partes=0;const chunk=new Uint8Array(1024*1024);const stream=new ReadableStream({pull(c){partes++;c.enqueue(chunk);}});
    await rejeita(async()=>{for await(const _ of limitarFluxoMidia(stream,LIMITE_MIDIA+1))void _;},413);assert.equal(partes<=103,true);
    aoPersistir=()=>sqlite.prepare("update usuarios set papel='editor' where id='admin'").run();
    await rejeita(()=>enviarMidia(db,admin,bucket,pedido()),403);aoPersistir=undefined;
    sqlite.prepare("update usuarios set papel='administrador' where id='admin'").run();assert.equal(arquivos.size,antes);assert.equal(sqlite.prepare('select count(*) total from registros_moderacao').get().total,auditoria);
});
test('vídeo e imagem sem associação publicada têm apenas preview admin atual; rascunho não vaza por ID',async()=>{
    await rejeita(()=>ler(video.id),404);await rejeita(()=>ler(imagem.id),404);assert.equal((await ler(video.id,{},admin)).status,200);
    await rejeita(()=>ler(video.id,{}, {...admin,id:'editor'}),404);
    sqlite.prepare('insert into temporadas(id,titulo_id,numero,nome,ordem,criado_em,atualizado_em) values(?,?,?,?,?,?,?)').run('temp','1',1,'Temporada',1,1,1);
    episodio='ep';sqlite.prepare('insert into episodios(id,titulo_id,temporada_id,numero,titulo,duracao,video_url,poster,publicado,criado_em,atualizado_em) values(?,?,?,?,?,?,?,?,?,?,?)').run(episodio,'1','temp',1,'Episódio',24,video.url,imagem.url,0,1,1);
    await rejeita(()=>ler(video.id),404);await rejeita(()=>ler(imagem.id),404);
    sqlite.prepare('update episodios set publicado=1 where id=?').run(episodio);assert.equal((await ler(video.id)).status,200);assert.equal((await ler(imagem.id)).status,200);
    for(const comando of ["update episodios set estreia_em=9999999999999","update temporadas set arquivado=1","update episodios set arquivado=1"]){sqlite.exec(comando);await rejeita(()=>ler(video.id),404);await rejeita(()=>ler(imagem.id),404);sqlite.exec('update episodios set estreia_em=null,arquivado=0;update temporadas set arquivado=0');}
    sqlite.prepare('insert into catalogo_disponibilidade(titulo_id,oculto) values(?,1)').run('1');await rejeita(()=>ler(video.id),404);await rejeita(()=>ler(imagem.id),404);sqlite.exec('update catalogo_disponibilidade set oculto=0');
});
test('fontes diretas ativas liberam vídeo; Range, HEAD e intervalos inválidos mantêm autorização e headers',async()=>{
    sqlite.prepare("update episodios set video_url='https://externo.test/outro.mp4' where id=?").run(episodio);
    await rejeita(()=>ler(video.id),404);sqlite.prepare('insert into episodio_fontes(id,episodio_id,nome,tipo,url,ordem,ativo) values(?,?,?,?,?,?,?)').run('fonte',episodio,'Servidor','direto',video.url,1,1);
    const parcial=await ler(video.id,{range:'bytes=1-2'});assert.equal(parcial.status,206);assert.equal(parcial.headers.get('content-range'),'bytes 1-2/4');assert.equal(parcial.headers.get('content-type'),'video/mp4');assert.equal(parcial.headers.get('x-content-type-options'),'nosniff');assert.equal(parcial.headers.get('cache-control'),'private, no-store');assert.deepEqual([...new Uint8Array(await parcial.arrayBuffer())],[2,3]);assert.ok(ultimoRange instanceof Headers);
    assert.deepEqual([...new Uint8Array(await(await ler(video.id,{range:'bytes=-2'})).arrayBuffer())],[3,4]);
    for(const range of ['bytes=4-','bytes=2-1','bytes=0-1,3-3','bytes=-0','broken']){const resposta=await ler(video.id,{range});assert.equal(resposta.status,416);assert.equal(resposta.headers.get('content-range'),'bytes */4');}
    const cabeca=await HEAD(new Request(`https://yokira.test/api/midia/${video.id}`,{method:'HEAD'}),{params:Promise.resolve({id:video.id})});assert.equal(cabeca.status,200);assert.equal(cabeca.body,null);assert.equal(cabeca.headers.get('content-length'),'4');
    sqlite.exec('update episodio_fontes set ativo=0');const privado=await GET(new Request(`https://yokira.test/api/midia/${video.id}`),{params:Promise.resolve({id:video.id})});assert.equal(privado.status,404);assert.equal((await privado.text()).includes('midia/'),false);
});
test('imagem de acervo só fica pública enquanto o pai visível referencia o arquivo',async()=>{
    const {obterAcervo,salvarAcervo}=await import('./catalogo-administrativo.ts');
    const titulo=(await obterAcervo(db,true)).catalogo.find(t=>t.id==='2');
    const dados=Object.fromEntries(Object.entries(titulo).filter(([chave])=>!['id','oculto'].includes(chave)));
    await salvarAcervo(db,admin,{tipo:'titulo',alvoId:'2',dados:{...dados,poster:imagem.url},oculto:false,motivo:'Associar imagem ao título visível.'});
    sqlite.exec('update episodios set publicado=0');assert.equal((await ler(imagem.id)).status,200);
    sqlite.prepare('update catalogo_disponibilidade set oculto=1 where titulo_id=?').run('2');await rejeita(()=>ler(imagem.id),404);
});

test('imagem de banner só fica pública em destaque ativo de título visível',async()=>{
 const {salvarBanner,arquivarBanner}=await import('./banners.ts');
 const payload={tituloId:'4',imagem:imagem.url,personagem:'',link:'',intervaloSegundos:null,ordem:9,ativo:true,motivo:'Publicar imagem no destaque.'};
 const {id}=await salvarBanner(db,admin,payload);assert.equal((await ler(imagem.id)).status,200);
 await salvarBanner(db,admin,{...payload,id,ativo:false});await rejeita(()=>ler(imagem.id),404);
 await salvarBanner(db,admin,{...payload,id});assert.equal((await ler(imagem.id)).status,200);
 sqlite.prepare('insert into catalogo_disponibilidade(titulo_id,oculto) values(?,1)').run('4');await rejeita(()=>ler(imagem.id),404);
 sqlite.exec("update catalogo_disponibilidade set oculto=0 where titulo_id='4'");
 await arquivarBanner(db,admin,{id,motivo:'Arquivar banner de teste.'});await rejeita(()=>ler(imagem.id),404);
});
