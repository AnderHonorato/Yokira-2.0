import assert from 'node:assert/strict';
import { test } from 'node:test';
import { corpoJson, inteiro, nomeInicial, texto } from './validacao.ts';

test('valida nomes, inteiros e caracteres de controle',()=>{
 assert.equal(texto('  Ander\u0000  ','Nome',2,60),'Ander');
 assert.throws(()=>inteiro(1.5,'Tempo',0,100));assert.throws(()=>inteiro(-1,'Tempo',0,100));assert.throws(()=>texto('x','Nome',2,60));
 assert.equal(nomeInicial(new Headers()),'Visitante');
 assert.equal(nomeInicial(new Headers({'oai-authenticated-user-full-name':'Jo%C3%A3o','oai-authenticated-user-full-name-encoding':'percent-encoded-utf-8'})),'João');
});
test('exige JSON, mesma origem e tamanho máximo',async()=>{
 await assert.rejects(corpoJson(new Request('https://yokira.test/api',{method:'POST',headers:{origin:'https://hostil.test','content-type':'application/json'},body:'{}'})),/Origem/);
 await assert.rejects(corpoJson(new Request('https://yokira.test/api',{method:'POST',headers:{'content-type':'text/plain'},body:'{}'})),/JSON/);
 await assert.rejects(corpoJson(new Request('https://yokira.test/api',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({texto:'a'.repeat(66000)})})),/grande/);
 await assert.rejects(corpoJson(new Request('https://yokira.test/api',{method:'POST',headers:{'content-type':'application/json'},body:'[]'})),/inválido/);
 assert.deepEqual(await corpoJson(new Request('https://yokira.test/api',{method:'POST',headers:{origin:'https://yokira.test','content-type':'application/json'},body:'{"acao":"lista"}'})),{acao:'lista'});
});
