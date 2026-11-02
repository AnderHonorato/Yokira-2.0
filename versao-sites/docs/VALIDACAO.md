# Validação — Yokira 2.0

Data: 2026-11-02.

- TypeScript: `tsc --noEmit`, aprovado.
- Backend: `node --test lib/servidor/*.test.mjs`, 11 testes aprovados. Cobrem API real e Drizzle sobre SQLite/D1, isolamento entre usuários, CSRF, voto único, limites diários, respostas ocultas dos jogos e compartilhamento seguro de tier list.
- Migrações D1: ambas aplicadas com sucesso no banco local; publicação aplica as migrações de produção.
- Inspeção no navegador: home, busca por Frieren e abertura de detalhes, navegação dos jogos e bloqueio de participação anônima.
- Build de produção pelo helper oficial Sites concluído; o pacote publicado é produzido novamente do estado final.

A prévia gerenciada local é anônima. Os fluxos autenticados foram verificados nos testes de integração; autenticação da hospedagem pertence ao Sites. Nenhuma senha é armazenada pelo app.

O layout possui regras para celular, tablet e desktop. A revisão visual desta entrega foi feita no viewport desktop; uma sessão visual em dispositivo móvel ainda não foi executada.

## Limites atuais

O catálogo inicial reúne 20 títulos e quatro guias autorais. Top 100 é o formato do ranking, atualmente limitado aos títulos cadastrados. Agenda mostra anos; não há datas semanais confirmadas. Notas são metadados de referência, não votos locais. Comunidade inicia sem atividade fictícia.

O player demonstra reprodução com Big Buck Bunny (Blender Foundation, CC BY 3.0), separado do catálogo. Upload e transcodificação dos episódios exigem o servidor Node/FFmpeg da base original; não estão hospedados no Worker. Mídias HLS próprias podem ser configuradas quando disponíveis.
