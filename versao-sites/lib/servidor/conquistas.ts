import { sql } from 'drizzle-orm';
import { conquistas, type ConquistaProgresso, type HallConquistas } from '../conquistas';
import { exigirAtivo, loteAtomico, type Db, type Usuario } from './permissoes';
import { ErroApi } from './validacao';
import { fatosConquistas } from './conquistas-fatos';

function regrasConquistas() {
 return sql.join(conquistas.map(c => sql`select ${c.badgeId} badgeId,${c.titulo} titulo,${c.descricao} descricao,
  ${c.meta} meta,${sql.identifier(c.feito)} progresso from fatos`), sql` union all `);
}
function destinoConquista(id: string) {
 return sql`case badge_id
 when 'primeira-publicacao' then coalesce((select '/?p='||(case when tipo='lista' then 'listas' else 'forum' end)||'&post='||id
  from publicacoes where autor_id=${id} and oculto=0 order by criado_em,id limit 1),'/?p=perfil')
 when 'primeiro-jogo' then '/?p=jogos&modo='||(select modo from jogos where usuario_id=${id} order by criado_em,id limit 1)
 when 'primeira-colecao' then '/?p=listas&editar='||(select titulo_id from lista where usuario_id=${id} order by criado_em,titulo_id limit 1)
 when 'primeiro-vinculo' then '/?p=amizades'
 when 'anfitriao' then coalesce((select '/?p=sala&salaId='||id from salas where dono_id=${id} order by criado_em,id limit 1),'/?p=salas')
 when 'companhia' then coalesce((select '/?p=sala&salaId='||s.id from sala_membros m join salas s on s.id=m.sala_id
  where m.usuario_id=${id} and s.dono_id<>${id} and m.expulso=0 order by m.entrou_em,s.id limit 1),'/?p=salas')
 else '/?p=perfil' end`;
}
/** Chamado dentro do mesmo lote das notificações; UNIQUE(user,badge) impede desbloqueios duplicados. */
export function sincronizarConquistas(id: string) {
 const agora = Date.now();
 return [
  sql`with fatos as (${fatosConquistas(id)}), regras as (${regrasConquistas()})
   insert or ignore into conquistas_usuario(usuario_id,badge_id,obtida_em)
   select ${id},badgeId,${agora} from regras where progresso>=meta`,
  sql`with fatos as (${fatosConquistas(id)}), regras as (${regrasConquistas()})
   insert or ignore into notificacoes(id,usuario_id,evento,tipo,titulo,descricao,destino,criado_em,badge_id)
   select lower(hex(randomblob(16))),${id},c.badge_id,'conquista',r.titulo,r.descricao,
    ${destinoConquista(id)},c.obtida_em,c.badge_id
   from conquistas_usuario c join regras r on r.badgeId=c.badge_id where c.usuario_id=${id}`,
 ];
}
export async function listarConquistas(db: Db, usuario: Usuario): Promise<HallConquistas> {
 const resultados = await loteAtomico(db, [
  ...sincronizarConquistas(usuario.id), fatosConquistas(usuario.id),
  sql`select badge_id badgeId,obtida_em obtidaEm from conquistas_usuario where usuario_id=${usuario.id}`,
  sql`select badge_id badgeId from conquistas_destaques where usuario_id=${usuario.id} order by posicao`,
 ]);
 const fatos = (resultados[2].results?.[0] || {}) as Record<string, number>;
 const obtidas = new Map(((resultados[3].results || []) as { badgeId: string; obtidaEm: number }[]).map(c => [c.badgeId, c.obtidaEm]));
 return {
  conquistas: conquistas.map(({ feito, ...item }) => ({ ...item, progresso: Math.min(item.meta, fatos[feito] || 0), obtidaEm: obtidas.get(item.badgeId) ?? null })),
  destaques: ((resultados[4].results || []) as { badgeId: string }[]).map(c => c.badgeId),
 };
}
export async function equiparConquistas(db: Db, usuario: Usuario, dados: Record<string, unknown>): Promise<HallConquistas> {
 exigirAtivo(usuario);
 const ids = dados.destaques;
 if (!Array.isArray(ids) || ids.length > 3 || ids.some(id => typeof id !== 'string') || new Set(ids).size !== ids.length)
  throw new ErroApi('Escolha até três conquistas diferentes.');
 const painel = await listarConquistas(db, usuario);
 if (ids.some(id => !painel.conquistas.some(c => c.badgeId === id && c.obtidaEm !== null)))
  throw new ErroApi('Somente conquistas obtidas podem ocupar o hall.');
 const ativo = sql`exists(select 1 from usuarios where id=${usuario.id} and suspenso=0)`;
 const [autorizacao] = await loteAtomico(db, [
  sql`select id from usuarios where id=${usuario.id} and suspenso=0`,
  sql`delete from conquistas_destaques where usuario_id=${usuario.id} and ${ativo}`,
  ...ids.map((id, posicao) => sql`insert into conquistas_destaques(usuario_id,badge_id,posicao)
   select usuario_id,badge_id,${posicao} from conquistas_usuario
   where usuario_id=${usuario.id} and badge_id=${id} and ${ativo}`),
 ]);
 if (!autorizacao.results?.length) throw new ErroApi('Sua conta não pode editar o hall.', 403);
 return { ...painel, destaques: ids };
}
/** Perfil público recebe exclusivamente emblemas escolhidos e obtidos, nunca contagens ou histórico. */
export async function listarDestaquesConquistas(db: Db, usuarioId: string): Promise<ConquistaProgresso[]> {
 const [resultado] = await loteAtomico(db, [sql`select d.badge_id badgeId,c.obtida_em obtidaEm
  from conquistas_destaques d join conquistas_usuario c on c.usuario_id=d.usuario_id and c.badge_id=d.badge_id
  where d.usuario_id=${usuarioId} order by d.posicao`]);
 return ((resultado.results || []) as { badgeId: string; obtidaEm: number }[]).flatMap(item => {
  const definicao = conquistas.find(c => c.badgeId === item.badgeId);
  if (!definicao) return [];
  const { feito: _feito, ...def } = definicao;
  void _feito;
  return [{ ...def, progresso: def.meta, obtidaEm: item.obtidaEm }];
 });
}
