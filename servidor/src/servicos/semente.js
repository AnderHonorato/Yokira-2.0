// Primeira execução: cria membros de exemplo, tópicos e mensagens para a comunidade não nascer vazia.
// Membros de exemplo têm bot: true e não conseguem entrar (senha aleatória).
import { randomBytes } from 'node:crypto';
import { dados } from './usuarios.js';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { lerJSON, pastaDados } from './arquivo.js';

// Grava na hora (as rotas leem estes arquivos logo em seguida)
const salvarJSON = (nome, d) => writeFileSync(join(pastaDados, nome), JSON.stringify(d, null, 2));

const NOMES = [['Kitsune_br', 41200], ['mestreDoSofá', 28800], ['luaDeFerrugem', 16300], ['akari.dev', 9100],
  ['noturna77', 5600], ['pipocaOtaku', 3400], ['raposaCinza', 1900], ['setsuna', 820], ['tio_do_anime', 410], ['nanami.s', 90]];
const CORES = ['#8b5cf6', '#38bdf8', '#f472b6', '#4ade80', '#f59e0b', '#fb7185'];

export function semear() {
  if (dados.usuarios.length) return;
  const agora = Date.now();
  NOMES.forEach(([nome, xp], i) => dados.usuarios.push({
    id: `bot${i}`, bot: true, nome, email: `${i}@exemplo.invalid`, hash: `${randomBytes(8).toString('hex')}:x`, papel: 'membro',
    cor: CORES[i % CORES.length], bio: 'Membro de exemplo da comunidade.', xp, criadoEm: new Date(agora - i * 864e5 * 9).toISOString(),
    biblioteca: { lista: {}, favoritos: {}, progresso: {}, assistidos: {} }, votos: {},
  }));
  const acoes = ['avaliou um anime', 'mandou mensagem no chat', 'abriu um tópico no fórum', 'votou no anime da semana', 'terminou um episódio'];
  dados.atividades = Array.from({ length: 14 }, (_, i) => ({ id: i, usuarioId: `bot${i % 8}`, acao: acoes[i % acoes.length], pontos: 10, em: new Date(agora - i * 37 * 60000).toISOString() }));
  writeFileSync(join(pastaDados, 'usuarios.json'), JSON.stringify(dados, null, 2));

  const forum = lerJSON('forum.json', { topicos: [] });
  const t = (titulo, texto, categoria, autor, horas, fixado = false, respostas = []) => ({
    id: `t${forum.topicos.length}`, titulo, texto, categoria, autorId: autor, em: new Date(agora - horas * 36e5).toISOString(),
    votantes: ['bot1', 'bot2', 'bot3'].slice(0, horas % 4), fixado,
    respostas: respostas.map(([a, txt], j) => ({ id: `r${j}`, autorId: a, texto: txt, em: new Date(agora - (horas - j - 1) * 36e5).toISOString() })),
  });
  forum.topicos.push(
    t('Boas-vindas: leia antes de postar', 'Respeite todo mundo, marque spoilers na categoria certa e divirta-se.', 'Geral', 'bot0', 200, true),
    t('Qual anime da temporada te pegou de surpresa?', 'Comecei sem expectativa e agora não perco um episódio. E vocês?', 'Recomendações', 'bot3', 6, false, [['bot1', 'Ruído Branco, sem dúvida.'], ['bot5', 'Expresso Sakura está muito bom.']]),
    t('Teoria: o farol é o mesmo nos dois animes?', 'Reparei em detalhes parecidos entre Cidade dos Faróis Apagados e Vozes do Farol Norte.', 'Teorias', 'bot2', 20, false, [['bot0', 'Faz sentido, mesmo estúdio!']]),
    t('Sugestão: sala de chat para cada temporada', 'Seria legal ter salas fixas por temporada além das salas por anime.', 'Sugestões', 'bot4', 48),
  );
  salvarJSON('forum.json', forum);

  const chat = lerJSON('chat.json', { geral: [] });
  const falas = [['bot1', 'bom dia, pessoal'], ['bot4', 'alguém já viu o episódio novo de Ruído Branco?'], ['bot2', 'vi! o final foi demais'], ['bot6', 'sem spoiler aqui no geral hein 😅'], ['bot0', 'bem-vindos a quem chegou agora']];
  chat.geral = falas.map(([id, texto], i) => {
    const u = dados.usuarios.find((x) => x.id === id);
    return { id: `m${i}`, sala: 'geral', texto, em: new Date(agora - (falas.length - i) * 9 * 60000).toISOString(),
      autor: { id: u.id, nome: u.nome, cor: u.cor, xp: u.xp, papel: u.papel } };
  });
  salvarJSON('chat.json', chat);
}

// Roda ao importar: index.js importa este arquivo antes das rotas
semear();
