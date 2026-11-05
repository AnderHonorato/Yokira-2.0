import { sql } from 'drizzle-orm';
import { loteAtomico, type Db, type Usuario } from './permissoes';
import { ErroApi, texto } from './validacao';
import { listarDestaquesConquistas } from './conquistas';
import type { PerfilSocial } from '../social';
import { ativoSocial, colunasPessoa, garantirPerfil, limitarSocial, nomeSeguro, normalizarHandle, pessoa, relacaoSql, sugestaoHandle } from './social-base';

type LinhaPerfil = Omit<PerfilSocial, 'publico' | 'mostrarConquistas'> & { publico: boolean | number; mostrarConquistas: boolean | number };
async function lerPerfil(db: Db, handle: string, usuario: Usuario | null): Promise<PerfilSocial> {
 const id = usuario?.id || '';
 const [linha] = await db.all<LinhaPerfil>(sql`select ${colunasPessoa},${relacaoSql(id)},p.bio,p.publico,
  p.mostrar_conquistas as mostrarConquistas,p.atualizado_em as atualizadoEm from perfis_sociais p
  join usuarios u on u.id=p.usuario_id left join amizades a on a.usuario_a=min(${id},u.id) and a.usuario_b=max(${id},u.id)
  where p.handle=${handle} and u.suspenso=0 and not exists(select 1 from bloqueios_sociais where
   (autor_id=${id} and alvo_id=u.id) or (autor_id=u.id and alvo_id=${id}))
  and (p.publico=1 or u.id=${id} or (a.estado='aceita' and ${ativoSocial(id)})) limit 1`);
 if (!linha) throw new ErroApi('Perfil não encontrado ou indisponível.', 404);
 const conquistas = linha.mostrarConquistas || linha.id === id ? await listarDestaquesConquistas(db, linha.id) : [];
 return { ...pessoa(linha), bio: linha.bio, publico: !!linha.publico, mostrarConquistas: !!linha.mostrarConquistas, atualizadoEm: Number(linha.atualizadoEm), conquistas };
}
export async function obterPerfilSocial(db: Db, usuario: Usuario) {
 const handle = await garantirPerfil(db, usuario);
 return { perfil: await lerPerfil(db, handle, usuario) };
}
export async function obterPerfilPublico(db: Db, handle: unknown, usuario: Usuario | null = null) {
 return { perfil: await lerPerfil(db, normalizarHandle(handle), usuario) };
}
export async function salvarPerfilSocial(db: Db, usuario: Usuario, dados: Record<string, unknown>) {
 const permitidos = new Set(['acao','nome','handle','bio','publico','mostrarConquistas']);
 if (Object.keys(dados).some(k => !permitidos.has(k))) throw new ErroApi('Campo de perfil não permitido.');
 const nome = texto(dados.nome, 'Nome público', 2, 60), bio = texto(dados.bio, 'Biografia', 0, 280), handle = normalizarHandle(dados.handle);
 if (nomeSeguro(nome) !== nome || /[^\s@]+@[^\s@]+\.[^\s@]+/.test(bio)) throw new ErroApi('Não publique emails no nome ou na biografia.');
 if (typeof dados.publico !== 'boolean' || typeof dados.mostrarConquistas !== 'boolean') throw new ErroApi('Escolha a privacidade do perfil.');
 await limitarSocial(db, usuario);
 await garantirPerfil(db, usuario);
 let alterado;
 try {
  [alterado] = await loteAtomico(db, [sql`update perfis_sociais set handle=${handle},bio=${bio},publico=${dados.publico ? 1 : 0},
   mostrar_conquistas=${dados.mostrarConquistas ? 1 : 0},atualizado_em=max(atualizado_em+1,${Date.now()})
   where usuario_id=${usuario.id} and ${ativoSocial(usuario.id)} returning usuario_id`,
   sql`update usuarios set nome=${nome} where id=${usuario.id} and suspenso=0 and changes()>0`]);
 } catch (erro) {
  const [ocupado] = await db.all(sql`select 1 from perfis_sociais where handle=${handle} and usuario_id<>${usuario.id}`);
  if (ocupado) throw new ErroApi(`Este @ já está em uso. Sugestão disponível: @${await sugestaoHandle(db, handle, usuario.id)}.`, 409);
  throw erro;
 }
 if (!alterado.results.length) throw new ErroApi('Sua conta não está ativa.', 403);
 return { ok: true, ...await obterPerfilSocial(db, usuario) };
}
