import { sql } from 'drizzle-orm';
/** Contagens exclusivas do banco. Nenhum progresso, XP ou desbloqueio é aceito do cliente. */
export function fatosConquistas(id: string) {
 return sql`select
 (select count(*) from usuarios where id=${id}) conta,
 (select count(*) from publicacoes where autor_id=${id} and oculto=0) publicacoes,
 (select count(*) from publicacoes where autor_id=${id} and oculto=0 and tipo='forum') forum,
 (select count(*) from respostas r join publicacoes p on p.id=r.publicacao_id
   where r.autor_id=${id} and r.oculto=0 and p.oculto=0) respostas,
 (select count(*) from votos where usuario_id=${id}) votos,
 (select count(*) from lista where usuario_id=${id}) colecao,
 (select count(*) from lista where usuario_id=${id} and situacao='concluido') concluidos,
 (select count(*) from lista where usuario_id=${id} and nota is not null) avaliados,
 (select count(*) from jogos where usuario_id=${id}) jogos,
 (select count(distinct modo) from jogos where usuario_id=${id}) modos,
 (select count(*) from jogos where usuario_id=${id} and json_valid(dados)
   and json_extract(case when json_valid(dados) then dados else '{}' end,'$.concluido')=1) jogosConcluidos,
 (select count(*) from jogos where usuario_id=${id} and modo='adivinhe' and json_valid(dados)
   and json_extract(case when json_valid(dados) then dados else '{}' end,'$.concluido')=1
   and json_extract(case when json_valid(dados) then dados else '{}' end,'$.ganhou')=1) vitorias,
 (select count(*) from amizades where estado='aceita' and (usuario_a=${id} or usuario_b=${id})) amizades,
 (select count(*) from salas where dono_id=${id}) salasCriadas,
 (select count(*) from sala_membros m join salas s on s.id=m.sala_id
   where m.usuario_id=${id} and s.dono_id<>${id} and m.expulso=0) salasParticipadas,
 coalesce((select xp from usuarios where id=${id}),0) xp`;
}
