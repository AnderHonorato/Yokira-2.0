import {sql} from 'drizzle-orm';
import {exigirAtivo,loteAtomico,type Db,type Usuario} from './permissoes';
import {ativoSocial,garantirPerfil} from './social-base';
import {donoSala,episodioSalaPublico} from './salas-base';
import {idImagemComunidade,imagemDoUsuario} from './imagens-comunidade';
import {ErroApi,identificador,texto} from './validacao';

const padraoId=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export async function enviarChatGlobal(db:Db,usuario:Usuario,p:Record<string,unknown>){
 exigirAtivo(usuario);
 if(Object.keys(p).some(k=>!['acao','corpo','imagem','salaId','requisicaoId'].includes(k)))throw new ErroApi('Campo de mensagem não permitido.');
 const corpo=p.corpo===undefined?'':texto(p.corpo,'Mensagem',0,1000);
 const imagem=p.imagem===undefined||p.imagem===''?null:idImagemComunidade(p.imagem);
 const sala=p.salaId===undefined?null:identificador(p.salaId);
 if(imagem&&sala)throw new ErroApi('Envie foto ou convite em mensagens separadas.');
 if(!corpo&&!imagem&&!sala)throw new ErroApi('Escreva uma mensagem ou selecione uma foto.');
 const id=p.requisicaoId===undefined?crypto.randomUUID():p.requisicaoId;
 if(typeof id!=='string'||!padraoId.test(id))throw new ErroApi('Identificador de envio inválido.');
 await garantirPerfil(db,usuario);
 const valido=sql`${ativoSocial(usuario.id)} and ${imagem?imagemDoUsuario(usuario.id,`/api/comunidade/imagens/${imagem}`,'chat'):sql`1=1`}
  and ${sala?sql`exists(select 1 from salas s where s.id=${sala} and ${donoSala(usuario.id)} and ${episodioSalaPublico()})`:sql`1=1`}`;
 const existente=async()=>{
  const [anterior]=await db.all<{autorId:string;corpo:string;imagemId:string|null;salaId:string|null}>(sql`select autor_id autorId,corpo,imagem_id imagemId,sala_id salaId from chat_mensagens where id=${id}`);
  if(!anterior)return false;
  if(anterior.autorId!==usuario.id||anterior.corpo!==corpo||anterior.imagemId!==imagem||anterior.salaId!==sala)
   throw new ErroApi('Este envio já foi usado para outra mensagem.',409);
  const [ativo]=await db.all(sql`select 1 where ${ativoSocial(usuario.id)}`);
  if(!ativo)throw new ErroApi('Sua conta não está ativa.',403);
  return true;
 };
 if(await existente())return {ok:true,id};
 const agora=Date.now();
 const [limite,criada]=await loteAtomico(db,[
  sql`insert into limites(usuario_id,janela,quantidade) select ${usuario.id},${`chat:${Math.floor(agora/10000)}`},1 where ${ativoSocial(usuario.id)}
   on conflict(usuario_id,janela) do update set quantidade=quantidade+1 where quantidade<8 returning quantidade`,
  sql`insert or ignore into chat_mensagens(id,autor_id,corpo,imagem_id,sala_id,criado_em)
   select ${id},${usuario.id},${corpo},${imagem},${sala},${agora} where changes()>0 and ${valido} returning id`
 ]);
 if(criada.results.length||await existente())return {ok:true,id};
 const [ativo]=await db.all(sql`select 1 where ${ativoSocial(usuario.id)}`);
 if(!ativo)throw new ErroApi('Sua conta não está ativa.',403);
 if(!limite.results.length)throw new ErroApi('Aguarde alguns segundos antes de enviar outra mensagem.',429);
 throw new ErroApi('Foto ou sala indisponível para este envio.',403);
}
