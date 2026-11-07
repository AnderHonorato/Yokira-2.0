import {sql,type SQL} from 'drizzle-orm';
import {recompensasPerfil,recompensaPerfil,visualPerfilPadrao,type VisualPerfil,type RecompensaPerfil,type ItemInventarioPerfil} from '../personalizacao-perfil';
import {ErroApi} from './validacao';
import {ativoSocial} from './social-base';
import type {Db} from './permissoes';

const tipos=['capa','moldura','aura'] as const;
export function validarVisualPerfil(valor:unknown):VisualPerfil{
 if(!valor||typeof valor!=='object'||Array.isArray(valor)||Object.keys(valor).length!==3
  ||Object.keys(valor).some(k=>!tipos.includes(k as typeof tipos[number]))
  ||tipos.some(tipo=>!Object.hasOwn(valor,tipo)||typeof (valor as VisualPerfil)[tipo]!=='string'
   ||(valor as VisualPerfil)[tipo].length>30||!recompensaPerfil(tipo,(valor as VisualPerfil)[tipo])))
  throw new ErroApi('Escolha uma capa, moldura e aura válidas.');
 return Object.fromEntries(tipos.map(tipo=>[tipo,(valor as VisualPerfil)[tipo]])) as VisualPerfil;
}
const imagemPessoal=(id:string,banner:SQL)=>sql`exists(select 1 from chat_imagens where usuario_id=${id}
 and finalidade='banner' and '/api/comunidade/imagens/'||id=${banner})`;
function requisito(item:RecompensaPerfil,id:string,banner:SQL):SQL{
 if(item.id==='pessoal'&&item.tipo==='capa')return imagemPessoal(id,banner);
 if(item.conquista)return sql`exists(select 1 from conquistas_usuario where usuario_id=${id} and badge_id=${item.conquista})`;
 if(item.nivel)return sql`exists(select 1 from usuarios where id=${id} and cast(max(0,xp)/100 as integer)+1>=${item.nivel})`;
 return sql`1=1`;
}
/** Somada ao UPDATE: a autorização não depende de uma consulta anterior ou de fatos do cliente. */
export function podeEquiparVisual(id:string,visual:VisualPerfil,banner:SQL):SQL{
 return sql`${ativoSocial(id)} and ${sql.join(tipos.map(tipo=>requisito(recompensaPerfil(tipo,visual[tipo])!,id,banner)),sql` and `)}`;
}
async function estadoVisual(db:Db,id:string){
 const [estado]=await db.all<{xp:number;pessoal:number;obtidas:string}>(sql`select max(0,u.xp) xp,
 ${imagemPessoal(id,sql`p.banner`)} pessoal,
 (select json_group_array(badge_id) from conquistas_usuario where usuario_id=u.id) obtidas
 from usuarios u join perfis_sociais p on p.usuario_id=u.id where u.id=${id} and u.suspenso=0`);
 return estado;
}
function inventario(estado:{xp:number;pessoal:number;obtidas:string}):ItemInventarioPerfil[]{
 const obtidas=new Set<string>(JSON.parse(estado.obtidas||'[]'));
 return recompensasPerfil.map(item=>({...item,liberada:item.id==='pessoal'&&item.tipo==='capa'?!!estado.pessoal:
  item.conquista?obtidas.has(item.conquista):item.nivel?Math.floor(Math.max(0,estado.xp)/100)+1>=item.nivel:true}));
}
export async function inventarioPerfil(db:Db,id:string):Promise<ItemInventarioPerfil[]>{
 const estado=await estadoVisual(db,id);if(!estado)throw new ErroApi('Perfil indisponível.',404);
 return inventario(estado);
}
/** Revalida inclusive a leitura pública: apenas os três itens equipados saem deste helper. */
export async function visualEquipado(db:Db,id:string,valor:unknown):Promise<VisualPerfil>{
 const estado=await estadoVisual(db,id);if(!estado)return {...visualPerfilPadrao};
 let visual:VisualPerfil;
 try{visual=validarVisualPerfil(typeof valor==='string'?JSON.parse(valor):valor);}catch{visual={...visualPerfilPadrao};}
 const itens=inventario(estado);
 return Object.fromEntries(tipos.map(tipo=>[tipo,itens.find(item=>item.tipo===tipo&&item.id===visual[tipo])?.liberada?visual[tipo]:visualPerfilPadrao[tipo]])) as VisualPerfil;
}
