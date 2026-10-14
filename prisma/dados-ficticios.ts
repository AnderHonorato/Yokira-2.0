// Arquivo: prisma/dados-ficticios.ts
// Catalogo INVENTADO. Os titulos das telas de referencia sao obra de terceiros e servem
// so de guia de layout — nada daquilo entra no repositorio. Aqui e tudo nosso.

export interface TituloFicticio {
  slug: string;
  nome: string;
  sinopse: string;
  ano: number;
  classificacao: string;
  generos: string[];
  temporadas: number;
  episodiosPorTemporada: number;
  destaque?: boolean;
  novidade?: boolean;
  emAlta?: boolean;
  popularidade: number;
}

export const GENEROS = [
  'Ação',
  'Aventura',
  'Fantasia',
  'Drama',
  'Comédia',
  'Ficção Científica',
  'Sobrenatural',
  'Esporte'
];

export const TITULOS: TituloFicticio[] = [
  {
    slug: 'lamina-do-crepusculo',
    nome: 'Lâmina do Crepúsculo',
    sinopse:
      'Depois de herdar uma espada que se alimenta de memórias, Rui precisa escolher entre lembrar quem foi e vencer quem o caça. Cada golpe cobra um pedaço do passado.',
    ano: 2021,
    classificacao: '16',
    generos: ['Ação', 'Fantasia'],
    temporadas: 4,
    episodiosPorTemporada: 12,
    destaque: true,
    novidade: true,
    popularidade: 990
  },
  {
    slug: 'porto-das-marés-longas',
    nome: 'Porto das Marés Longas',
    sinopse:
      'Uma tripulação de cartógrafos mapeia ilhas que só existem durante a maré alta. O que eles registram no mapa passa a existir de verdade.',
    ano: 1999,
    classificacao: '12',
    generos: ['Aventura', 'Fantasia'],
    temporadas: 6,
    episodiosPorTemporada: 14,
    destaque: true,
    popularidade: 960
  },
  {
    slug: 'circuito-kaji',
    nome: 'Circuito Kaji',
    sinopse:
      'Numa cidade onde brigas de rua viraram esporte oficial, um lutador aposentado treina a filha da pessoa que ele derrotou.',
    ano: 1986,
    classificacao: '14',
    generos: ['Ação', 'Esporte'],
    temporadas: 5,
    episodiosPorTemporada: 16,
    popularidade: 930
  },
  {
    slug: 'muralha-de-cinzas',
    nome: 'Muralha de Cinzas',
    sinopse:
      'A última cidade cercada descobre que a muralha não foi feita para manter os monstros fora, e sim para manter alguma coisa dentro.',
    ano: 2013,
    classificacao: '18',
    generos: ['Ação', 'Drama'],
    temporadas: 4,
    episodiosPorTemporada: 12,
    emAlta: true,
    popularidade: 920
  },
  {
    slug: 'pequenos-guardioes',
    nome: 'Pequenos Guardiões',
    sinopse:
      'Criaturas de bolso disputam torneios amistosos enquanto seus treinadores atravessam um continente em obras.',
    ano: 1997,
    classificacao: 'L',
    generos: ['Aventura', 'Comédia'],
    temporadas: 8,
    episodiosPorTemporada: 20,
    popularidade: 900
  },
  {
    slug: 'estacao-do-ceu-partido',
    nome: 'Estação do Céu Partido',
    sinopse:
      'Um trem que só circula durante eclipses leva passageiros para o dia em que eles mais se arrependeram.',
    ano: 2019,
    classificacao: '14',
    generos: ['Sobrenatural', 'Drama'],
    temporadas: 3,
    episodiosPorTemporada: 11,
    emAlta: true,
    destaque: true,
    popularidade: 890
  },
  {
    slug: 'academia-das-chamas-frias',
    nome: 'Academia das Chamas Frias',
    sinopse:
      'Numa escola onde todo aluno nasce com um poder, o calouro sem nenhum descobre que consegue desligar o poder dos outros.',
    ano: 2016,
    classificacao: '12',
    generos: ['Ação', 'Comédia'],
    temporadas: 6,
    episodiosPorTemporada: 13,
    emAlta: true,
    popularidade: 880
  },
  {
    slug: 'relogio-de-tóquio-baixo',
    nome: 'Relógio de Tóquio Baixo',
    sinopse:
      'Um entregador volta doze anos no tempo toda vez que atravessa o mesmo cruzamento na chuva. E a chuva não para.',
    ano: 2021,
    classificacao: '16',
    generos: ['Ficção Científica', 'Drama'],
    temporadas: 3,
    episodiosPorTemporada: 12,
    emAlta: true,
    popularidade: 870
  },
  {
    slug: 'ceifador-de-agosto',
    nome: 'Ceifador de Agosto',
    sinopse:
      'Um ex-shinigami trabalha como zelador de cemitério e finge não ver as almas que ainda pedem carona.',
    ano: 2004,
    classificacao: '16',
    generos: ['Sobrenatural', 'Ação'],
    temporadas: 7,
    episodiosPorTemporada: 15,
    emAlta: true,
    popularidade: 860
  },
  {
    slug: 'alquimia-de-ferro-doce',
    nome: 'Alquimia de Ferro Doce',
    sinopse:
      'Dois irmãos trocam pedaços do próprio corpo por conhecimento e descobrem tarde demais que o preço é cobrado em parcelas.',
    ano: 2009,
    classificacao: '14',
    generos: ['Fantasia', 'Aventura'],
    temporadas: 2,
    episodiosPorTemporada: 32,
    popularidade: 850
  },
  {
    slug: 'colosso-numero-oito',
    nome: 'Colosso Número Oito',
    sinopse:
      'Aos trinta e dois anos, um faxineiro de campo de batalha finalmente é aprovado no exército — no mesmo dia em que vira aquilo que o exército combate.',
    ano: 2024,
    classificacao: '16',
    generos: ['Ação', 'Ficção Científica'],
    temporadas: 1,
    episodiosPorTemporada: 12,
    novidade: true,
    destaque: true,
    popularidade: 840
  },
  {
    slug: 'quebra-vento',
    nome: 'Quebra-Vento',
    sinopse:
      'O aluno mais temido da escola só quer ser o mais forte, mas a turma insiste em transformá-lo em líder de comunidade.',
    ano: 2024,
    classificacao: '14',
    generos: ['Ação', 'Comédia'],
    temporadas: 1,
    episodiosPorTemporada: 13,
    novidade: true,
    popularidade: 830
  },
  {
    slug: 'ascensao-solitaria',
    nome: 'Ascensão Solitária',
    sinopse:
      'O caçador mais fraco do país recebe um sistema que só ele enxerga, e cada missão cumprida o afasta mais da vida que tinha.',
    ano: 2023,
    classificacao: '16',
    generos: ['Ação', 'Fantasia'],
    temporadas: 2,
    episodiosPorTemporada: 12,
    novidade: true,
    destaque: true,
    popularidade: 820
  },
  {
    slug: 'noite-que-nao-veio',
    nome: 'A Noite que Não Veio',
    sinopse:
      'Uma cidade litorânea passa quarenta dias sem escurecer e os moradores começam a esquecer o que faziam à noite.',
    ano: 2025,
    classificacao: '16',
    generos: ['Sobrenatural', 'Drama'],
    temporadas: 1,
    episodiosPorTemporada: 10,
    novidade: true,
    popularidade: 810
  }
];

export const NOMES_DE_EPISODIO = [
  'O Incidente da Ponte – Abrir',
  'O Incidente da Ponte – Fervor',
  'O Incidente da Ponte – Confusão',
  'O Incidente da Ponte – Raiva',
  'O Incidente da Ponte – Destruição',
  'O Incidente da Ponte – Lágrimas',
  'Véspera',
  'Traço de Sal',
  'Costura',
  'O Dia Mais Curto',
  'Marés Contrárias',
  'Ponto Cego',
  'Aquilo que Ficou',
  'Último Sinal',
  'Recomeço'
];
