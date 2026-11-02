import Portal from './portal';

export const dynamic='force-dynamic';

export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const recebidos=await searchParams;
 const parametros=new URLSearchParams();
 for(const [chave,valor] of Object.entries(recebidos||{})){
  const primeiro=Array.isArray(valor)?valor[0]:valor;
  if(primeiro!==undefined)parametros.set(chave,primeiro);
 }
 return <Portal parametrosIniciais={parametros.toString()}/>;
}
