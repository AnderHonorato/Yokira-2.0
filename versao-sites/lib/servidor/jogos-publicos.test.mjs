import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dadosPublicos } from './jogos-publicos.ts';
test('adivinhe oculta resposta até encerramento e não altera dado persistido',()=>{
 const jogo={id:'j1',modo:'adivinhe',dados:JSON.stringify({respostaId:'segredo',tentativas:[],concluido:false})};
 assert.equal(dadosPublicos(jogo,()=>undefined).respostaId,undefined);
 assert.equal(JSON.parse(jogo.dados).respostaId,'segredo');
 jogo.dados=JSON.stringify({respostaId:'segredo',concluido:true});assert.equal(dadosPublicos(jogo,()=>undefined).respostaId,'segredo');
});
test('quiz não revela resposta da questão atual ou de questões futuras',()=>{
 const jogo={id:'j2',modo:'quiz',dados:JSON.stringify({indice:0,pontos:0,versao:0,concluido:false,questoes:[{respostaId:'segredo',opcoes:['a','b','segredo','d']},{respostaId:'futuro',opcoes:['x']}]})};
 const publico=dadosPublicos(jogo,()=> 'Sinopse da questão');
 assert.equal(publico.questoes,undefined);assert.equal(publico.respostaId,undefined);
 assert.deepEqual(publico.pergunta,{sinopse:'Sinopse da questão',opcoes:['a','b','segredo','d']});assert.equal(JSON.stringify(publico).includes('futuro'),false);
});
test('torneio retorna só o confronto corrente e resultado permitido',()=>{
 const publico=dadosPublicos({id:'j3',modo:'torneio',dados:JSON.stringify({fila:['a','b','c','d'],proxima:['e'],rodada:1,concluido:false,versao:2})},()=>undefined);
 assert.deepEqual(publico.par,['a','b']);assert.equal(publico.fila,undefined);assert.equal(publico.versao,2);
});
