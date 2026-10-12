// Gera o catálogo fictício (banco.json). Rode com: npm run dados
// Todo o conteúdo é inventado — nenhum título, sinopse ou imagem de terceiros.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const pasta = dirname(fileURLToPath(import.meta.url));

// PRNG determinístico (mulberry32) para o catálogo sair igual em toda máquina
function criarSorteio(semente) {
  let a = semente;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const sortear = criarSorteio(2026);
const escolher = (lista) => lista[Math.floor(sortear() * lista.length)];
const entre = (min, max) => Math.floor(sortear() * (max - min + 1)) + min;
const embaralhar = (lista) => [...lista].sort(() => sortear() - 0.5);

export const GENEROS = ['Ação', 'Aventura', 'Comédia', 'Drama', 'Fantasia', 'Terror', 'Mecha', 'Música',
  'Mistério', 'Psicológico', 'Romance', 'Sci-Fi', 'Slice of Life', 'Esporte', 'Sobrenatural', 'Suspense'];
export const FORMATOS = ['TV', 'Filme', 'OVA', 'ONA', 'Especial'];
export const TEMPORADAS = ['inverno', 'primavera', 'verao', 'outono'];

const TITULOS = [
  ['Lâmina do Crepúsculo', 'Tasogare no Yaiba'], ['Cidade dos Faróis Apagados', 'Kieta Tōdai no Machi'],
  ['O Último Trem para Kamiyo', 'Kamiyo-yuki Saishū Ressha'], ['Guilda dos Relógios Quebrados', 'Kowareta Tokei Girudo'],
  ['Céu de Papel', 'Kami no Sora'], ['Herdeiros da Maré Vermelha', 'Akashio no Kōkeisha'],
  ['Clube de Astronomia Noturna', 'Yakan Tenmonbu'], ['Mecânica do Coração Ferro', 'Tetsu no Shinzō Kikō'],
  ['A Raposa e o Arquivista', 'Kitsune to Shishokan'], ['Distrito Neon 09', 'Neon-ku Kyū'],
  ['Sinfonia do Vale Esquecido', 'Wasureta Tani no Kōkyōkyoku'], ['Dragões de Aluguel', 'Rentaru Doragon'],
  ['Pétalas sobre o Asfalto', 'Asufaruto no Hanabira'], ['O Detetive que Não Dormia', 'Nemuranai Tantei'],
  ['Fronteira de Vidro', 'Garasu no Kyōkai'], ['Cozinha de Outro Mundo', 'Isekai Daidokoro'],
  ['Ecos de Akatsuki', 'Akatsuki no Kodama'], ['Ponto Cego', 'Shikaku'],
  ['A Torre que Engolia Nuvens', 'Kumo wo Nomu Tō'], ['Corrida das Estações', 'Kisetsu Rēsu'],
  ['Pacto com a Sombra Gentil', 'Yasashii Kage to no Keiyaku'], ['Ruído Branco', 'Howaito Noizu'],
  ['Academia de Magia Irregular', 'Fuki Mahō Gakuen'], ['Jardim dos Autômatos', 'Jidō Ningyō no Niwa'],
  ['Silêncio na Linha 4', 'Yon-gōsen no Chinmoku'], ['Lua de Ferrugem', 'Sabi no Tsuki'],
  ['O Ferreiro de Estrelas', 'Hoshi no Kajiya'], ['Bairro dos Gatos Errantes', 'Noraneko-chō'],
  ['Protocolo Hikari', 'Hikari Purotokoru'], ['Onda Final', 'Saigo no Nami'],
  ['Remanso', 'Yodomi'], ['Capitães do Vento Leste', 'Higashikaze no Senchō'],
  ['Biblioteca Submersa', 'Suichū Toshokan'], ['Tinta e Trovão', 'Sumi to Kaminari'],
  ['Pequenos Deuses do Telhado', 'Yane no Chiisana Kami'], ['Rede Fantasma', 'Bōrei Nettowāku'],
  ['Kendô ao Amanhecer', 'Yoake no Kendō'], ['Chave Mestra', 'Masutā Kī'],
  ['Inverno em Hokuseki', 'Hokuseki no Fuyu'], ['Quintal Infinito', 'Mugen no Niwa'],
  ['Vozes do Farol Norte', 'Kita Tōdai no Koe'], ['Expresso Sakura', 'Sakura Kyūkō'],
  ['A Garota do Mapa Rasgado', 'Yabureta Chizu no Shōjo'], ['Teorema do Caos Doce', 'Amai Konton Teiri'],
  ['Turno da Meia-Noite', 'Mayonaka Shifuto'], ['Asas de Cobre', 'Dō no Tsubasa'],
  ['Ponte Sobre o Nada', 'Kyomu no Hashi'], ['Primeira Estrela', 'Ichiban Boshi'],
];

const ESTUDIOS = ['Estúdio Hanabi', 'Kumo Works', 'Aurora Pictures', 'Mizuiro Lab', 'Tora Animation', 'Studio Orbe'];
const NOMES = ['Akari', 'Ren', 'Sora', 'Haru', 'Mio', 'Kaito', 'Yuna', 'Daichi', 'Hina', 'Riku', 'Aoi',
  'Takumi', 'Nanami', 'Sho', 'Emi', 'Kenji', 'Rin', 'Yuki', 'Itsuki', 'Mei'];
const SOBRENOMES = ['Kurosawa', 'Amano', 'Fujimoto', 'Hoshino', 'Ishida', 'Kageyama', 'Minase', 'Nakamura',
  'Sakuraba', 'Tachibana', 'Yamashiro', 'Watanuki'];
const PAPEIS = ['Protagonista', 'Protagonista', 'Rival', 'Mentor', 'Aliado', 'Antagonista', 'Aliado'];
const DUBLADORES = ['Tomoe Arai', 'Kōji Ueda', 'Saki Morimoto', 'Hiro Shimada', 'Aya Kanzaki', 'Junpei Oda',
  'Mariko Seno', 'Taiga Nishi'];

const GANCHOS = [
  'Quando %P descobre que %X, a rotina de uma cidade inteira começa a desmoronar.',
  '%P só queria uma vida tranquila, mas %X muda tudo da noite para o dia.',
  'Depois que %X, %P precisa decidir em quem ainda pode confiar.',
  'Um acordo antigo volta à tona quando %P percebe que %X.',
];
const SEGREDOS = ['o próprio reflexo guarda memórias que não são suas', 'os mapas da região mentem há séculos',
  'cada promessa quebrada vira um espírito faminto', 'o colégio esconde uma estação de trem desativada',
  'a música certa consegue parar o tempo por alguns segundos', 'a guilda que o salvou nunca existiu oficialmente',
  'as estrelas estão caindo uma por noite', 'a cozinha da avó abre portas para outros mundos'];
const FECHOS = ['Uma história sobre amizade, perda e as escolhas que definem quem somos.',
  'Entre batalhas e silêncios, o que está em jogo é muito maior do que parece.',
  'Leve, engraçado e inesperadamente comovente.',
  'Cada episódio aproxima um pouco mais a verdade — e o preço de conhecê-la.'];

const TITULOS_EP = ['O começo de tudo', 'Promessa ao entardecer', 'A porta do outro lado', 'Fogo e chuva',
  'O que ficou para trás', 'Quem vigia o vigia', 'Um passo em falso', 'A canção esquecida', 'Reencontro',
  'Linhas cruzadas', 'O peso da escolha', 'Antes do amanhecer', 'Tudo o que somos', 'O mapa incompleto',
  'Sem volta', 'O último sinal', 'Herança', 'Céu aberto', 'Ponto de ruptura', 'Até a próxima estação',
  'Ruídos', 'Fio de prata', 'A casa vazia', 'Final'];

const VIDEO_PADRAO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export const slugificar = (texto) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function gerarPersonagens() {
  return embaralhar(NOMES).slice(0, entre(4, 7)).map((nome, i) => ({
    nome: `${nome} ${escolher(SOBRENOMES)}`,
    papel: PAPEIS[i] ?? 'Coadjuvante',
    principal: i < 4,
    dublador: escolher(DUBLADORES),
    descricao: `${nome} ${escolher(['carrega um segredo de família', 'é movido(a) por uma promessa antiga',
      'nunca recusa um desafio', 'observa mais do que fala', 'tenta proteger quem ama a qualquer custo'])}.`,
  }));
}

function gerarEpisodios(total, exibidos) {
  return Array.from({ length: total }, (_, i) => ({
    numero: i + 1,
    titulo: TITULOS_EP[i % TITULOS_EP.length],
    duracao: entre(22, 25),
    disponivel: i < exibidos,
    urlVideo: VIDEO_PADRAO,
  }));
}

function gerarAnime(par, indice, hoje) {
  const [titulo, original] = par;
  const status = indice < 14 ? 'no-ar' : indice < 20 ? 'em-breve' : 'finalizado';
  const formato = indice % 9 === 4 ? 'Filme' : indice % 11 === 7 ? 'ONA' : 'TV';
  const ano = status === 'finalizado' ? entre(2008, 2025) : 2026;
  const totalEps = formato === 'Filme' ? 1 : escolher([12, 12, 13, 24, 25]);
  const exibidos = status === 'finalizado' ? totalEps : status === 'em-breve' ? 0 : entre(2, totalEps - 1);
  const generos = embaralhar(GENEROS).slice(0, entre(2, 4));
  const protagonista = `${escolher(NOMES)} ${escolher(SOBRENOMES)}`;
  const sinopse = [escolher(GANCHOS).replace('%P', protagonista).replace('%X', escolher(SEGREDOS)), escolher(FECHOS)].join(' ');
  const estreia = new Date(hoje);
  estreia.setDate(estreia.getDate() + (status === 'em-breve' ? entre(5, 90) : -entre(20, 400)));

  return {
    id: indice + 1,
    slug: slugificar(titulo),
    titulo,
    tituloOriginal: original,
    sinopse,
    generos,
    formato,
    status,
    ano,
    temporada: status === 'finalizado' ? escolher(TEMPORADAS) : 'outono',
    estudio: escolher(ESTUDIOS),
    nota: status === 'em-breve' ? null : Number((6.2 + sortear() * 3.1).toFixed(1)),
    popularidade: entre(800, 98000),
    tendencia: status === 'no-ar' ? entre(10, 100) : entre(0, 30),
    classificacao: escolher(['L', '10', '12', '14', '16']),
    duracaoEpisodio: formato === 'Filme' ? entre(95, 130) : 24,
    totalEpisodios: totalEps,
    diaExibicao: status === 'no-ar' ? indice % 7 : null,
    horario: status === 'no-ar' ? `${entre(10, 23)}:${escolher(['00', '30'])}` : null,
    dataEstreia: estreia.toISOString().slice(0, 10),
    dublado: sortear() > 0.55,
    personagens: gerarPersonagens(),
    episodios: gerarEpisodios(totalEps, exibidos),
    favoritos: entre(40, 9000),
  };
}

function gerarNoticias(animes) {
  const modelos = [
    (a) => [`${a.titulo} ganha novo trailer e confirma data de estreia`, 'Trailer'],
    (a) => [`${a.estudio} anuncia segunda temporada de ${a.titulo}`, 'Anúncio'],
    (a) => [`Elenco de dublagem de ${a.titulo} é revelado`, 'Dublagem'],
    (a) => [`${a.titulo}: o que esperar da reta final`, 'Análise'],
    (a) => [`Tema de abertura de ${a.titulo} chega às plataformas de música`, 'Música'],
    (a) => [`Guia da temporada: por que ${a.titulo} merece sua atenção`, 'Guia'],
  ];
  return modelos.map((modelo, i) => {
    const anime = animes[(i * 5) % animes.length];
    const [titulo, tag] = modelo(anime);
    const data = new Date(); data.setDate(data.getDate() - i * 2);
    return {
      slug: slugificar(titulo), titulo, tag, animeSlug: anime.slug, data: data.toISOString().slice(0, 10),
      resumo: `Tudo sobre ${anime.titulo}, produção do ${anime.estudio}: novidades, bastidores e o que vem por aí.`,
      corpo: [
        `A equipe do ${anime.estudio} divulgou nesta semana novas informações sobre ${anime.titulo}.`,
        anime.sinopse,
        'Acompanhe a agenda da Yōkira para não perder nenhum episódio e adicione o título à sua lista.',
      ],
    };
  });
}

function gerarRanking() {
  return ['Kitsune_br', 'mestreDoSofá', 'luaDeFerrugem', 'akari.dev', 'noturna77', 'pipocaOtaku', 'raposaCinza']
    .map((nome, i) => ({ posicao: i + 1, nome, xp: Math.round(62000 / (1 + i * 0.32)), nivel: i < 3 ? 'Lendário' : 'Veterano' }));
}

export function gerarBanco() {
  const hoje = new Date();
  const animes = TITULOS.map((par, i) => gerarAnime(par, i, hoje));
  return { geradoEm: hoje.toISOString(), animes, noticias: gerarNoticias(animes), ranking: gerarRanking() };
}

// Execução direta: grava o arquivo
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const banco = gerarBanco();
  writeFileSync(join(pasta, 'banco.json'), JSON.stringify(banco, null, 2));
  console.log(`banco.json gerado com ${banco.animes.length} animes e ${banco.noticias.length} notícias.`);
}
