import { sql } from 'drizzle-orm';
import { loteAtomico, type Db, type Usuario } from './permissoes';
import { ErroApi, identificador, texto } from './validacao';
import type { PainelAmizades, PessoaSocial } from '../social';
import { ativoSocial, colunasPessoa, garantirPerfil, limitarSocial, pessoa, relacaoSql, semBloqueio } from './social-base';

export async function listarAmizades(db: Db, usuario: Usuario, busca: unknown = ''): Promise<PainelAmizades> {
 await limitarSocial(db, usuario, 90);
 await garantirPerfil(db, usuario);
 const termo = texto(busca, 'Busca', 0, 60).replace(/^@/, '').toLowerCase();
 const id = usuario.id;
 const [relacoes, bloqueados, resultados] = await Promise.all([
  db.all<PessoaSocial>(sql`select ${colunasPessoa},${relacaoSql(id)} from amizades a
   join usuarios u on u.id=case when a.usuario_a=${id} then a.usuario_b else a.usuario_a end
   join perfis_sociais p on p.usuario_id=u.id where (a.usuario_a=${id} or a.usuario_b=${id}) and u.suspenso=0
   and not exists(select 1 from bloqueios_sociais b where (b.autor_id=${id} and b.alvo_id=u.id) or (b.autor_id=u.id and b.alvo_id=${id}))
   order by a.atualizado_em desc,u.id limit 500`),
  db.all<PessoaSocial>(sql`select ${colunasPessoa},'bloqueado' as relacao from bloqueios_sociais b
   join usuarios u on u.id=b.alvo_id join perfis_sociais p on p.usuario_id=u.id where b.autor_id=${id}
   order by b.criado_em desc,u.id limit 500`),
  termo.length < 2 ? Promise.resolve([]) : db.all<PessoaSocial>(sql`select ${colunasPessoa},${relacaoSql(id)}
   from perfis_sociais p join usuarios u on u.id=p.usuario_id
   left join amizades a on a.usuario_a=min(${id},u.id) and a.usuario_b=max(${id},u.id)
   where u.id<>${id} and u.suspenso=0 and p.publico=1
   and (instr(p.handle,${termo})>0 or instr(lower(case when instr(u.nome,'@')>0 then '' else u.nome end),${termo})>0)
   and not exists(select 1 from bloqueios_sociais b where (b.autor_id=${id} and b.alvo_id=u.id) or (b.autor_id=u.id and b.alvo_id=${id}))
   order by case when p.handle=${termo} then 0 else 1 end,p.handle limit 20`)
 ]);
 return { amigos: relacoes.filter(p => p.relacao === 'amigo').map(pessoa), recebidas: relacoes.filter(p => p.relacao === 'recebida').map(pessoa),
  enviadas: relacoes.filter(p => p.relacao === 'enviada').map(pessoa), bloqueados: bloqueados.map(pessoa), resultados: resultados.map(pessoa) };
}
export async function alterarAmizade(db: Db, usuario: Usuario, dados: Record<string, unknown>) {
 if (Object.keys(dados).some(k => !['acao','operacao','alvoId'].includes(k))) throw new ErroApi('Campo de amizade não permitido.');
 const alvo = identificador(dados.alvoId), id = usuario.id, op = texto(dados.operacao, 'Operação', 1, 20);
 if (!['solicitar','aceitar','recusar','cancelar','remover','bloquear','desbloquear'].includes(op)) throw new ErroApi('Operação de amizade inválida.');
 if (id === alvo) throw new ErroApi('Escolha outra pessoa.');
 await limitarSocial(db, usuario);
 const [destino] = await db.all(sql`select 1 from usuarios where id=${alvo}`);
 if (!destino) throw new ErroApi('Pessoa não encontrada.', 404);
 const par = sql`usuario_a=min(${id},${alvo}) and usuario_b=max(${id},${alvo})`;
 const permitido = sql`${ativoSocial(id)} and ${ativoSocial(alvo)} and ${semBloqueio(id, alvo)}`;
 if (op === 'bloquear' || op === 'desbloquear') {
  const consulta = op === 'bloquear' ? sql`insert into bloqueios_sociais(autor_id,alvo_id,criado_em)
   select ${id},${alvo},${Date.now()} where ${ativoSocial(id)} on conflict(autor_id,alvo_id) do update set criado_em=bloqueios_sociais.criado_em returning autor_id`
   : sql`delete from bloqueios_sociais where autor_id=${id} and alvo_id=${alvo} and ${ativoSocial(id)} returning autor_id`;
  const consultas = [consulta];
  if (op === 'bloquear') consultas.push(
   sql`delete from amizades where ${par} and ${ativoSocial(id)}
    and exists(select 1 from bloqueios_sociais where autor_id=${id} and alvo_id=${alvo})`,
   // Quem bloqueia sai da sala alheia; na própria sala, remove a pessoa bloqueada.
   // O bloqueio de um convidado nunca impede o dono de administrar a sala.
   sql`update sala_membros set ativo=0,expulso=case when usuario_id=${alvo} then 1 else expulso end
    where ${ativoSocial(id)} and exists(select 1 from bloqueios_sociais where autor_id=${id} and alvo_id=${alvo})
    and exists(select 1 from salas s where s.id=sala_membros.sala_id and s.encerrada=0 and
     (s.dono_id=${id} and sala_membros.usuario_id=${alvo} or s.dono_id<>${id} and sala_membros.usuario_id=${id}
      and exists(select 1 from sala_membros outro where outro.sala_id=s.id and outro.usuario_id=${alvo} and outro.ativo=1)))`
  );
  const [r] = await loteAtomico(db, consultas);
  if (!r.results.length && op === 'bloquear') throw new ErroApi('Sua conta não está ativa.', 403);
  return { ok: true };
 }
 let consulta;
 if (op === 'solicitar') consulta = sql`insert into amizades(usuario_a,usuario_b,solicitante_id,estado,criado_em,atualizado_em)
  select min(${id},${alvo}),max(${id},${alvo}),${id},'pendente',${Date.now()},${Date.now()} where ${permitido}
  and exists(select 1 from perfis_sociais where usuario_id=${alvo} and publico=1)
  on conflict(usuario_a,usuario_b) do update set atualizado_em=amizades.atualizado_em returning estado`;
 else if (op === 'aceitar') consulta = sql`update amizades set estado='aceita',atualizado_em=${Date.now()}
  where ${par} and solicitante_id<>${id} and ${permitido} returning estado`;
 else consulta = sql`delete from amizades where ${par} and ${permitido} and
  (${op === 'remover' ? 1 : 0}=1 and estado='aceita' or estado='pendente' and
   (${op === 'cancelar' ? 1 : 0}=1 and solicitante_id=${id} or ${op === 'recusar' ? 1 : 0}=1 and solicitante_id<>${id})) returning estado`;
 const [r] = await loteAtomico(db, [consulta]);
 if (!r.results.length) throw new ErroApi('Esta relação não está disponível para a ação escolhida.', 409);
 return { ok: true };
}
