/** A própria animação da barra mede o intervalo: pausa e retomada preservam o tempo. */
export function criarRelogioBanner(elemento: Pick<HTMLElement,'animate'>, duracaoMs: number, avancar: () => void) {
 const animacao=elemento.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:duracaoMs,fill:'forwards'});
 let ativo=true,concluido=false;
 animacao.pause();
 animacao.onfinish=()=>{if(ativo&&!concluido){concluido=true;avancar();}};
 return {
  definirRodando(rodando:boolean){
   if(!ativo||concluido||animacao.playState==='finished')return;
   if(rodando&&animacao.playState!=='running')animacao.play();
   else if(!rodando&&animacao.playState!=='paused')animacao.pause();
  },
  destruir(){ativo=false;animacao.onfinish=null;animacao.cancel();}
 };
}
export type RelogioBanner=ReturnType<typeof criarRelogioBanner>;
