import type { Db, Usuario } from './permissoes';
import { controlarSala, criarSala, entrarSala, entrarSalaPeloChat, mensagemSala } from './salas-mutacoes';
export { entrarSalaPeloChat } from './salas-mutacoes';
export { obterSalas, obterSala } from './salas-leitura';
export async function mutarSala(db:Db,usuario:Usuario,payload:Record<string,unknown>,origem?:string) {
 if(payload.acao==='sala-criar')return criarSala(db,usuario,payload,origem);
 if(payload.acao==='sala-entrar-chat')return entrarSalaPeloChat(db,usuario,payload);
 if(payload.acao==='sala-entrar')return entrarSala(db,usuario,payload);
 if(payload.acao==='sala-mensagem')return mensagemSala(db,usuario,payload);
 return controlarSala(db,usuario,payload);
}
