import Portal from './portal';
import {getDb} from '../db';
import {obterAcervo} from '../lib/servidor/catalogo-administrativo';
import {obterAparencia} from '../lib/servidor/aparencia';

export const dynamic='force-dynamic';

export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const recebidos=await searchParams;
 const parametros=new URLSearchParams();
 for(const [chave,valor] of Object.entries(recebidos||{})){
  const primeiro=Array.isArray(valor)?valor[0]:valor;
  if(primeiro!==undefined)parametros.set(chave,primeiro);
 }
 const db=getDb();
 const [acervoInicial,aparenciaInicial]=await Promise.all([obterAcervo(db),obterAparencia(db)]);
 return <Portal parametrosIniciais={parametros.toString()} acervoInicial={acervoInicial} aparenciaInicial={aparenciaInicial}/>;
}
