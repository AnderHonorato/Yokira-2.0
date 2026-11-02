/** Catálogo demonstrativo. Sinopses e editoriais são textos originais.
 * Metadados de temporadas específicas consultados em 02/11/2026.
 * `estreia` tem precisão de ANO; não representa uma data ou agenda de lançamento.
 * `episodios: 0` indica contagem não verificada para séries contínuas.
 * Notas são um retrato editorial da captura, não um ranking ao vivo.
 */
export type Anime = {
  id: string; slug: string; nome: string; sinopse: string; ano: number;
  nota: number; generos: string[]; tipo: 'Série' | 'Filme';
  status: 'Em exibição' | 'Completo' | 'Em breve'; episodios: number;
  duracao: number; poster: string; capa: string; estreia: string; video?: string;
};
export type Editorial = { id: string; titulo: string; resumo: string; corpo: string; imagem: string; categoria: string; data: string };

export const catalogo: Anime[] = [
  {
    "id": "1",
    "slug": "bleach",
    "nome": "BLEACH: Thousand-Year Blood War",
    "sinopse": "Ichigo Kurosaki volta a empunhar sua espada quando uma nova ameaça rompe o equilíbrio entre o mundo humano e a Sociedade das Almas.",
    "ano": 2022,
    "nota": 8.8,
    "generos": [
      "Ação",
      "Aventura",
      "Sobrenatural"
    ],
    "tipo": "Série",
    "status": "Completo",
    "episodios": 13,
    "duracao": 24,
    "poster": "/arte/bleach.webp",
    "capa": "/arte/bleach-capa.webp",
    "estreia": "2022"
  },
  {
    "id": "2",
    "slug": "one-piece",
    "nome": "One Piece",
    "sinopse": "Luffy e os Piratas do Chapéu de Palha atravessam mares extraordinários em busca do tesouro que pode coroar o próximo Rei dos Piratas.",
    "ano": 1999,
    "nota": 8.7,
    "generos": [
      "Ação",
      "Aventura",
      "Comédia",
      "Drama",
      "Fantasia"
    ],
    "tipo": "Série",
    "status": "Em exibição",
    "episodios": 0,
    "duracao": 24,
    "poster": "/arte/one-piece.webp",
    "capa": "/arte/one-piece-capa.webp",
    "estreia": "1999"
  },
  {
    "id": "3",
    "slug": "frieren",
    "nome": "Frieren: Beyond Journey’s End",
    "sinopse": "Décadas depois de uma grande vitória, uma maga elfa refaz antigos caminhos e descobre o valor do tempo que compartilhou com seus companheiros.",
    "ano": 2023,
    "nota": 9.1,
    "generos": [
      "Aventura",
      "Drama",
      "Fantasia"
    ],
    "tipo": "Série",
    "status": "Completo",
    "episodios": 28,
    "duracao": 24,
    "poster": "/arte/frieren.webp",
    "capa": "/arte/frieren-capa.webp",
    "estreia": "2023"
  },
  {
    "id": "4",
    "slug": "naruto",
    "nome": "Naruto",
    "sinopse": "Um jovem ninja que sonha em liderar sua vila encontra no Time 7 amizades, rivalidades e os primeiros desafios de uma longa jornada.",
    "ano": 2002,
    "nota": 8.0,
    "generos": [
      "Ação",
      "Aventura",
      "Comédia",
      "Drama",
      "Fantasia",
      "Sobrenatural"
    ],
    "tipo": "Série",
    "status": "Completo",
    "episodios": 220,
    "duracao": 23,
    "poster": "/arte/naruto.webp",
    "capa": "/arte/naruto-capa.webp",
    "estreia": "2002"
  },
  {
    "id": "5",
    "slug": "fullmetal-alchemist",
    "nome": "Fullmetal Alchemist: Brotherhood",
    "sinopse": "Após uma experiência de alquimia que transformou suas vidas, os irmãos Elric buscam uma maneira de recuperar aquilo que perderam.",
    "ano": 2009,
    "nota": 9.0,
    "generos": [
      "Ação",
      "Aventura",
      "Drama",
      "Fantasia"
    ],
    "tipo": "Série",
    "status": "Completo",
    "episodios": 64,
    "duracao": 25,
    "poster": "/arte/fullmetal-alchemist.webp",
    "capa": "/arte/fullmetal-alchemist-capa.webp",
    "estreia": "2009"
  },
  {
    "id": "6",
    "slug": "steins-gate",
    "nome": "Steins;Gate",
    "sinopse": "Um pequeno laboratório de Akihabara descobre como enviar mensagens ao passado. Cada mudança abre consequências difíceis de prever.",
    "ano": 2011,
    "nota": 8.9,
    "generos": [
      "Drama",
      "Psicológico",
      "Sci-Fi",
      "Suspense"
    ],
    "tipo": "Série",
    "status": "Completo",
    "episodios": 24,
    "duracao": 24,
    "poster": "/arte/steins-gate.webp",
    "capa": "/arte/steins-gate-capa.webp",
    "estreia": "2011"
  },
  {
    "id": "7",
    "slug": "hunter-x-hunter",
    "nome": "Hunter x Hunter (2011)",
    "sinopse": "Gon parte para se tornar um Hunter e encontrar o pai. Ao lado de novos amigos, enfrenta provas que exigem muito mais do que força.",
    "ano": 2011,
    "nota": 8.9,
    "generos": [
      "Ação",
      "Aventura",
      "Fantasia"
    ],
    "tipo": "Série",
    "status": "Completo",
    "episodios": 148,
    "duracao": 24,
    "poster": "/arte/hunter-x-hunter.webp",
    "capa": "/arte/hunter-x-hunter-capa.webp",
    "estreia": "2011"
  },
  {
    "id": "8",
    "slug": "vinland-saga",
    "nome": "Vinland Saga",
    "sinopse": "Na Europa do século XI, Thorfinn cresce entre guerreiros e batalhas enquanto uma busca pessoal ameaça consumir seu futuro.",
    "ano": 2019,
    "nota": 8.7,
    "generos": [
      "Ação",
      "Aventura",
      "Drama"
    ],
    "tipo": "Série",
    "status": "Completo",
    "episodios": 24,
    "duracao": 24,
    "poster": "/arte/vinland-saga.webp",
    "capa": "/arte/vinland-saga-capa.webp",
    "estreia": "2019"
  },
  {
    "id": "9",
    "slug": "cowboy-bebop",
    "nome": "Cowboy Bebop",
    "sinopse": "A bordo da Bebop, caçadores de recompensas cruzam o sistema solar entre trabalhos incertos, encontros inesperados e ecos do passado.",
    "ano": 1998,
    "nota": 8.6,
    "generos": [
      "Ação",
      "Aventura",
      "Drama",
      "Sci-Fi"
    ],
    "tipo": "Série",
    "status": "Completo",
    "episodios": 26,
    "duracao": 24,
    "poster": "/arte/cowboy-bebop.webp",
    "capa": "/arte/cowboy-bebop-capa.webp",
    "estreia": "1998"
  },
  {
    "id": "10",
    "slug": "your-name",
    "nome": "Your Name.",
    "sinopse": "Uma estudante do interior e um rapaz de Tóquio acordam no corpo um do outro. A conexão entre eles atravessa distâncias que desconhecem.",
    "ano": 2016,
    "nota": 8.5,
    "generos": [
      "Drama",
      "Romance",
      "Sobrenatural"
    ],
    "tipo": "Filme",
    "status": "Completo",
    "episodios": 1,
    "duracao": 107,
    "poster": "/arte/your-name.webp",
    "capa": "/arte/your-name-capa.webp",
    "estreia": "2016"
  },
  {
    "id": "11",
    "slug": "a-viagem-de-chihiro",
    "nome": "A Viagem de Chihiro",
    "sinopse": "Ao entrar em um mundo habitado por espíritos, Chihiro precisa trabalhar em uma casa de banhos e encontrar coragem para salvar sua família.",
    "ano": 2001,
    "nota": 8.6,
    "generos": [
      "Aventura",
      "Drama",
      "Fantasia",
      "Sobrenatural"
    ],
    "tipo": "Filme",
    "status": "Completo",
    "episodios": 1,
    "duracao": 125,
    "poster": "/arte/a-viagem-de-chihiro.webp",
    "capa": "/arte/a-viagem-de-chihiro-capa.webp",
    "estreia": "2001"
  },
  {
    "id": "12",
    "slug": "violet-evergarden",
    "nome": "Violet Evergarden",
    "sinopse": "Depois da guerra, Violet passa a escrever cartas para outras pessoas e aprende a reconhecer sentimentos que ainda não sabe nomear.",
    "ano": 2018,
    "nota": 8.5,
    "generos": [
      "Drama",
      "Fantasia",
      "Slice of Life"
    ],
    "tipo": "Série",
    "status": "Completo",
    "episodios": 13,
    "duracao": 24,
    "poster": "/arte/violet-evergarden.webp",
    "capa": "/arte/violet-evergarden-capa.webp",
    "estreia": "2018"
  },
  {
    "id": "13",
    "slug": "cyberpunk-edgerunners",
    "nome": "Cyberpunk: Edgerunners",
    "sinopse": "David encontra seu lugar entre mercenários que levam seus corpos ao limite em Night City, uma cidade de promessas e desigualdades.",
    "ano": 2022,
    "nota": 8.5,
    "generos": [
      "Ação",
      "Drama",
      "Psicológico",
      "Sci-Fi"
    ],
    "tipo": "Série",
    "status": "Completo",
    "episodios": 10,
    "duracao": 24,
    "poster": "/arte/cyberpunk-edgerunners.webp",
    "capa": "/arte/cyberpunk-edgerunners-capa.webp",
    "estreia": "2022"
  },
  {
    "id": "14",
    "slug": "diarios-de-uma-apotecaria",
    "nome": "Diários de uma Apotecária",
    "sinopse": "Levada ao palácio imperial, Maomao usa seus conhecimentos de remédios e venenos para investigar mistérios escondidos na rotina da corte.",
    "ano": 2023,
    "nota": 8.8,
    "generos": [
      "Drama",
      "Mistério"
    ],
    "tipo": "Série",
    "status": "Completo",
    "episodios": 24,
    "duracao": 23,
    "poster": "/arte/diarios-de-uma-apotecaria.webp",
    "capa": "/arte/diarios-de-uma-apotecaria-capa.webp",
    "estreia": "2023"
  },
  {
    "id": "15",
    "slug": "a-voz-do-silencio",
    "nome": "A Voz do Silêncio",
    "sinopse": "Anos depois de machucar uma colega na escola, Shoya tenta se aproximar dela e enfrentar as consequências de suas próprias atitudes.",
    "ano": 2016,
    "nota": 8.8,
    "generos": [
      "Drama",
      "Romance",
      "Slice of Life"
    ],
    "tipo": "Filme",
    "status": "Completo",
    "episodios": 1,
    "duracao": 130,
    "poster": "/arte/a-voz-do-silencio.webp",
    "capa": "/arte/a-voz-do-silencio-capa.webp",
    "estreia": "2016"
  },
  {
    "id": "16",
    "slug": "mob-psycho-100",
    "nome": "Mob Psycho 100 II",
    "sinopse": "Mob continua tentando amadurecer sem depender de seus poderes psíquicos, enquanto novas ameaças colocam seus laços à prova.",
    "ano": 2019,
    "nota": 8.7,
    "generos": [
      "Ação",
      "Comédia",
      "Drama",
      "Psicológico",
      "Slice of Life",
      "Sobrenatural"
    ],
    "tipo": "Série",
    "status": "Completo",
    "episodios": 13,
    "duracao": 24,
    "poster": "/arte/mob-psycho-100.webp",
    "capa": "/arte/mob-psycho-100-capa.webp",
    "estreia": "2019"
  },
  {
    "id": "17",
    "slug": "jujutsu-kaisen",
    "nome": "Jujutsu Kaisen — 2ª Temporada",
    "sinopse": "Uma missão do passado revela a juventude de Gojo e Geto. No presente, uma armadilha em Shibuya reúne feiticeiros e maldições.",
    "ano": 2023,
    "nota": 8.6,
    "generos": [
      "Ação",
      "Drama",
      "Sobrenatural"
    ],
    "tipo": "Série",
    "status": "Completo",
    "episodios": 23,
    "duracao": 24,
    "poster": "/arte/jujutsu-kaisen.webp",
    "capa": "/arte/jujutsu-kaisen-capa.webp",
    "estreia": "2023"
  },
  {
    "id": "18",
    "slug": "haikyu",
    "nome": "Haikyu!! — 2ª Temporada",
    "sinopse": "O time de vôlei da Karasuno volta aos treinos para o torneio da primavera. Hinata e Kageyama precisam aperfeiçoar sua conexão em quadra.",
    "ano": 2015,
    "nota": 8.6,
    "generos": [
      "Comédia",
      "Drama",
      "Esporte"
    ],
    "tipo": "Série",
    "status": "Completo",
    "episodios": 25,
    "duracao": 24,
    "poster": "/arte/haikyu.webp",
    "capa": "/arte/haikyu-capa.webp",
    "estreia": "2015"
  },
  {
    "id": "19",
    "slug": "chainsaw-man-reze",
    "nome": "Chainsaw Man: O Filme — Arco da Reze",
    "sinopse": "A rotina de Denji muda depois de um encontro com Reze. Entre afeto e perigo, o jovem enfrenta uma nova disputa por seu coração.",
    "ano": 2025,
    "nota": 9.0,
    "generos": [
      "Ação",
      "Drama",
      "Terror",
      "Romance",
      "Sobrenatural"
    ],
    "tipo": "Filme",
    "status": "Completo",
    "episodios": 1,
    "duracao": 100,
    "poster": "/arte/chainsaw-man-reze.webp",
    "capa": "/arte/chainsaw-man-reze-capa.webp",
    "estreia": "2025"
  },
  {
    "id": "20",
    "slug": "monster",
    "nome": "Monster",
    "sinopse": "O neurocirurgião Kenzo Tenma salva um garoto e, anos depois, se vê diante de uma cadeia de crimes que o obriga a revisitar aquela decisão.",
    "ano": 2004,
    "nota": 8.8,
    "generos": [
      "Drama",
      "Terror",
      "Mistério",
      "Psicológico",
      "Suspense"
    ],
    "tipo": "Série",
    "status": "Completo",
    "episodios": 74,
    "duracao": 24,
    "poster": "/arte/monster.webp",
    "capa": "/arte/monster-capa.webp",
    "estreia": "2004"
  }
];

export const editoriais: Editorial[] = [
  {
    "id": "por-onde-comecar",
    "titulo": "Por onde começar no mundo dos animes?",
    "resumo": "Da aventura à ficção científica: encontre uma história que combine com você.",
    "corpo": "Você não precisa conhecer todos os gêneros para começar. Pense primeiro no tipo de história que costuma prender sua atenção. Aventuras apresentam mundos e amizades; mistérios convidam a observar detalhes; dramas se concentram nos sentimentos dos personagens.\n\nPara uma experiência curta, escolha um filme. Para acompanhar um universo por mais tempo, experimente os primeiros episódios de uma série. A duração e a classificação indicativa ajudam a decidir o que cabe no seu momento.\n\nUse sua lista para guardar descobertas e anotar o que deseja continuar. Seu repertório pode crescer no seu ritmo, sem a obrigação de acompanhar tudo.",
    "imagem": "/arte/frieren-capa.webp",
    "categoria": "GUIA",
    "data": "2026-10-28"
  },
  {
    "id": "a-arte-de-observar",
    "titulo": "A beleza de desacelerar e observar",
    "resumo": "O que histórias como Frieren e Violet Evergarden encontram nos pequenos gestos.",
    "corpo": "Nem toda jornada precisa avançar pela próxima batalha. Algumas histórias dão espaço a uma conversa, uma paisagem ou um objeto que guarda lembranças. Esses intervalos permitem que o espectador conheça as pessoas por trás da aventura.\n\nEm Frieren, a passagem do tempo muda o sentido de encontros antigos. Em Violet Evergarden, cartas aproximam pessoas que têm dificuldade de colocar sentimentos em palavras. As duas propostas convidam a prestar atenção no que fica entre uma fala e outra.\n\nAssistir sem pressa também pode ser uma forma de descobrir detalhes da animação, da música e das escolhas de enquadramento.",
    "imagem": "/arte/violet-evergarden-capa.webp",
    "categoria": "ESPECIAL",
    "data": "2026-10-30"
  },
  {
    "id": "filmes-para-sua-lista",
    "titulo": "Uma noite, uma grande história",
    "resumo": "Filmes para descobrir novos mundos sem assumir uma temporada inteira.",
    "corpo": "Um longa de animação pode construir um universo completo em uma única sessão. Your Name aproxima duas vidas por meio de uma conexão impossível; A Viagem de Chihiro transforma o desconhecido em descoberta; A Voz do Silêncio acompanha a difícil tentativa de reparar um passado.\n\nSão experiências diferentes, unidas pela atenção às relações humanas. Antes de escolher, consulte a sinopse, a duração e a classificação indicativa na plataforma oficial disponível em sua região.\n\nDepois da sessão, vale registrar sua impressão sem reduzir a experiência a uma nota. Uma cena, um som ou uma personagem também podem ser uma boa lembrança.",
    "imagem": "/arte/your-name-capa.webp",
    "categoria": "CURADORIA",
    "data": "2026-10-31"
  },
  {
    "id": "alem-da-acao",
    "titulo": "Muito além da próxima batalha",
    "resumo": "Amizade, escolhas e crescimento nas histórias de ação.",
    "corpo": "O movimento chama a atenção, mas são as escolhas dos personagens que sustentam uma boa história de ação. Em Fullmetal Alchemist: Brotherhood, o desejo de consertar um erro conduz uma investigação sobre responsabilidade. Em Hunter x Hunter, desafios transformam a maneira como os protagonistas veem o mundo.\n\nOs conflitos também podem mostrar como uma equipe aprende a confiar uns nos outros. Haikyu!! leva essa ideia para o esporte, onde cada ponto depende de observação, prática e colaboração.\n\nAo explorar o catálogo, combine gêneros e descubra o que existe por trás da premissa. Uma aventura pode ser também um drama, uma comédia ou uma história sobre amadurecer.",
    "imagem": "/arte/fullmetal-alchemist-capa.webp",
    "categoria": "LEITURA",
    "data": "2026-11-01"
  }
];

export const hero = "/arte/hero.webp";

export const demonstracaoVideo = {
  "titulo": "Big Buck Bunny — demonstração",
  "url": "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "license": "CC BY 3.0 · Blender Foundation",
  "licenseUrl": "https://creativecommons.org/licenses/by/3.0/",
  "autor": "Blender Foundation",
  "descricao": "Curta de animação aberto usado exclusivamente para demonstrar o reprodutor. Não é um episódio do catálogo."
};
