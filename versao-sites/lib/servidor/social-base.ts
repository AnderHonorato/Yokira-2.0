import { sql, type SQL } from 'drizzle-orm';
import { loteAtomico, type Db, type Usuario } from './permissoes';
import { ErroApi, texto } from './validacao';
import type { PessoaSocial, RelacaoSocial } from '../social';

export const ativoSocial = (id: string): SQL => sql`exists(select 1 from usuarios where id=${id} and suspenso=0)`;
export const semBloqueio = (a: string, b: string): SQL => sql`not exists(select 1 from bloqueios_sociais where
 (autor_id=${a} and alvo_id=${b}) or (autor_id=${b} and alvo_id=${a}))`;
export const amizadeAceita = (a: string, b: string): SQL => sql`exists(select 1 from amizades where
 usuario_a=min(${a},${b}) and usuario_b=max(${a},${b}) and estado='aceita')`;
export const nomeSeguro = (nome: string) => nome.includes('@') ? 'Membro Yokira' : nome;
export const colunasPessoa = sql`u.id,case when instr(u.nome,'@')>0 then 'Membro Yokira' else u.nome end as nome,
 p.handle,cast(max(0,u.xp)/100 as integer)+1 as nivel`;
export const relacaoSql = (id: string): SQL => sql`case when u.id=${id} then 'proprio'
 when exists(select 1 from bloqueios_sociais where autor_id=${id} and alvo_id=u.id) then 'bloqueado'
 when a.estado='aceita' then 'amigo' when a.solicitante_id=${id} then 'enviada'
 when a.estado='pendente' then 'recebida' else 'nenhuma' end as relacao`;
export function pessoa(linha: PessoaSocial): PessoaSocial {
 return { id: linha.id, nome: nomeSeguro(linha.nome), handle: linha.handle, nivel: Number(linha.nivel), relacao: linha.relacao as RelacaoSocial };
}
export function normalizarHandle(valor: unknown) {
 const handle = texto(valor, 'Identificador @', 3, 25).replace(/^@/, '').toLowerCase();
 if (!/^[a-z0-9][a-z0-9_]{2,23}$/.test(handle) || ['admin','administrador','moderador','suporte','yokira','api'].includes(handle))
  throw new ErroApi('Use de 3 a 24 letras, números ou sublinhado no @.');
 return handle;
}
/** Backfill seguro para qualquer provedor: o identificador não deriva de emails. */
export async function garantirPerfil(db: Db, usuario: Usuario): Promise<string> {
 for (let tentativa = 0; tentativa < 4; tentativa++) {
  const gerado = `membro_${crypto.randomUUID().replaceAll('-', '').slice(0, 16)}`;
  await loteAtomico(db, [sql`insert or ignore into perfis_sociais(usuario_id,handle,atualizado_em)
   select ${usuario.id},${gerado},${Date.now()} where exists(select 1 from usuarios where id=${usuario.id})`]);
  const [perfil] = await db.all<{ handle: string }>(sql`select handle from perfis_sociais where usuario_id=${usuario.id}`);
  if (perfil) return perfil.handle;
 }
 throw new ErroApi('Não foi possível preparar seu perfil. Tente novamente.', 503);
}
export async function sugestaoHandle(db: Db, base: string, usuarioId: string) {
 for (let tentativa = 0; tentativa < 8; tentativa++) {
  const candidato = `${base.slice(0, 15)}_${crypto.randomUUID().replaceAll('-', '').slice(0, 8)}`;
  const [ocupado] = await db.all(sql`select 1 from perfis_sociais where handle=${candidato} and usuario_id<>${usuarioId}`);
  if (!ocupado) return candidato;
 }
 throw new ErroApi('Não foi possível consultar os identificadores. Tente novamente.', 503);
}
export async function consultarHandle(db: Db, usuario: Usuario, valor: unknown) {
 await limitarSocial(db, usuario, 90);
 const handle = normalizarHandle(valor);
 const [ocupado] = await db.all(sql`select 1 from perfis_sociais where handle=${handle} and usuario_id<>${usuario.id}`);
 return { handle, disponivel: !ocupado, sugestao: ocupado ? await sugestaoHandle(db, handle, usuario.id) : handle };
}
export async function limitarSocial(db: Db, usuario: Usuario, max = 40) {
 if (usuario.suspenso) throw new ErroApi('Sua conta está suspensa.', 403);
 const [r] = await loteAtomico(db, [sql`insert into limites(usuario_id,janela,quantidade)
  select ${usuario.id},${`social:${Math.floor(Date.now()/60000)}`},1 where ${ativoSocial(usuario.id)}
  on conflict(usuario_id,janela) do update set quantidade=quantidade+1 where quantidade<${max} returning quantidade`]);
 if (!r.results.length) {
  const [ativo] = await db.all(sql`select 1 from usuarios where id=${usuario.id} and suspenso=0`);
  throw new ErroApi(ativo ? 'Muitas ações. Aguarde um minuto e tente novamente.' : 'Sua conta não está ativa.', ativo ? 429 : 403);
 }
}
