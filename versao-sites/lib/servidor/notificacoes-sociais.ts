import { sql, type SQL } from 'drizzle-orm';
import { ativoSocial, semBloqueio } from './social-base';

/** O ciclo identifica a relação: retries não duplicam eventos; uma nova relação tem novo ciclo. */
export function registrarNotificacaoAmizade(id: string, alvo: string, operacao: 'solicitar' | 'aceitar') {
 const pedido = operacao === 'solicitar';
 return sql`insert or ignore into notificacoes_sociais(id,usuario_id,autor_id,ciclo,tipo,criado_em)
  select lower(hex(randomblob(16))),${pedido ? sql`${alvo}` : sql`solicitante_id`},${id},ciclo,
  ${pedido ? 'pedido-amizade' : 'amizade-aceita'},${Date.now()} from amizades
  where usuario_a=min(${id},${alvo}) and usuario_b=max(${id},${alvo}) and changes()>0
  and ${pedido ? sql`estado='pendente' and solicitante_id=${id}` : sql`estado='aceita' and solicitante_id<>${id}`}
  and ${ativoSocial(id)} and ${ativoSocial(alvo)} and ${semBloqueio(id, alvo)}`;
}
const colunas = sql`id,'amizade' tipo,
 case tipo when 'pedido-amizade' then 'Pedido de amizade recebido' else 'Pedido de amizade aceito' end titulo,
 (select case when instr(nome,'@')>0 then 'Membro Yokira' else nome end from usuarios where id=notificacoes_sociais.autor_id)
 ||case tipo when 'pedido-amizade' then ' enviou uma solicitação de amizade.' else ' aceitou sua solicitação de amizade.' end descricao,
 case tipo when 'pedido-amizade' then '/?p=amizades&aba=recebidas' else '/?p=amizades' end destino,criado_em as criadoEm,lida_em as lidaEm,criado_em as celebradaEm,null as badgeId`;
function visivel(id: string) {
 return sql`usuario_id=${id} and ${ativoSocial(id)}
  and exists(select 1 from usuarios where id=notificacoes_sociais.autor_id and suspenso=0)
  and not exists(select 1 from bloqueios_sociais where
   (autor_id=${id} and alvo_id=notificacoes_sociais.autor_id) or (alvo_id=${id} and autor_id=notificacoes_sociais.autor_id))`;
}
export const listarNotificacoesSociais = (id: string) => sql`select ${colunas} from notificacoes_sociais where ${visivel(id)}`;
/** Eventos sociais aceitam leitura; nunca participam da reivindicação das celebrações. */
export const lerNotificacoesSociais = (id: string, filtro: SQL) => sql`update notificacoes_sociais
 set lida_em=coalesce(lida_em,${Date.now()}) where ${visivel(id)} and ${filtro} returning ${colunas}`;
