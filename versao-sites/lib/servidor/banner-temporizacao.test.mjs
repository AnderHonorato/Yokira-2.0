import assert from 'node:assert/strict';
import {test} from 'node:test';
import {criarRelogioBanner} from '../relogio-banner.ts';

function superficie(){
 let quantidade=0,animacao;
 const elemento={animate(quadros,opcoes){
  quantidade++;
  animacao={currentTime:0,playState:'running',onfinish:null,
   play(){this.playState='running';},pause(){this.playState='paused';},cancel(){this.playState='idle';},
   avancar(ms){if(this.playState!=='running')return;this.currentTime=Math.min(opcoes.duration,this.currentTime+ms);if(this.currentTime===opcoes.duration){this.playState='finished';this.onfinish?.();}}
  };
  assert.deepEqual(quadros,[{transform:'scaleX(0)'},{transform:'scaleX(1)'}]);
  return animacao;
 }};
 return {elemento,get animacao(){return animacao;},get quantidade(){return quantidade;}};
}
test('barra e troca usam o mesmo tempo restante depois de uma pausa longa',()=>{
 const tela=superficie();let trocas=0;
 const relogio=criarRelogioBanner(tela.elemento,10000,()=>trocas++);
 assert.equal(tela.animacao.playState,'paused');
 relogio.definirRodando(true);tela.animacao.avancar(3000);
 relogio.definirRodando(false);tela.animacao.avancar(60000);
 assert.equal(tela.animacao.currentTime,3000);assert.equal(trocas,0);
 relogio.definirRodando(true);tela.animacao.avancar(6999);
 assert.equal(trocas,0);assert.equal(tela.quantidade,1);
 tela.animacao.avancar(1);assert.equal(trocas,1);
 relogio.definirRodando(true);assert.equal(tela.animacao.playState,'finished');
});
test('cancelar a seleção impede uma troca tardia disparada pelo relógio antigo',()=>{
 const tela=superficie();let trocas=0;
 const relogio=criarRelogioBanner(tela.elemento,5000,()=>trocas++);
 relogio.definirRodando(true);tela.animacao.avancar(2000);
 const eventoPendente=tela.animacao.onfinish;
 relogio.destruir();eventoPendente();
 assert.equal(trocas,0);assert.equal(tela.animacao.playState,'idle');assert.equal(tela.animacao.onfinish,null);
 relogio.definirRodando(true);assert.equal(tela.animacao.playState,'idle');
});
test('o fim de um destaque só avança uma vez e não reinicia pela retomada',()=>{
 const tela=superficie();let trocas=0;
 const relogio=criarRelogioBanner(tela.elemento,3000,()=>trocas++);
 relogio.definirRodando(true);tela.animacao.avancar(3000);
 const terminar=tela.animacao.onfinish;terminar();
 relogio.definirRodando(false);relogio.definirRodando(true);
 assert.equal(trocas,1);assert.equal(tela.animacao.currentTime,3000);assert.equal(tela.quantidade,1);
});
