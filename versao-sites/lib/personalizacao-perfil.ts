import type { RaridadeConquista } from './conquistas';

export type TipoRecompensaPerfil = 'capa' | 'moldura' | 'aura';
export type VisualPerfil = { capa: string; moldura: string; aura: string };
export type RecompensaPerfil = {
 id: string; tipo: TipoRecompensaPerfil; nome: string; descricao: string;
 raridade: RaridadeConquista; conquista?: string; nivel?: number; imagem?: string;
};
export type ItemInventarioPerfil = RecompensaPerfil & { liberada: boolean };
export const visualPerfilPadrao: VisualPerfil = { capa: 'origem', moldura: 'essencial', aura: 'brisa' };
const arte = (nome: string) => `/arte/cenarios/${nome}.webp`;
export const recompensasPerfil: readonly RecompensaPerfil[] = [
 {id:'origem',tipo:'capa',nome:'Obsidiana',descricao:'A identidade escura do Yokira.',raridade:'comum'},
 {id:'pessoal',tipo:'capa',nome:'Minha imagem',descricao:'Use a capa enviada por você.',raridade:'comum'},
 {id:'sakura',tipo:'capa',nome:'Sakura ao luar',descricao:'Desbloqueie Sua jornada começa.',raridade:'comum',conquista:'boas-vindas',imagem:arte('01-sakura-luar')},
 {id:'neon',tipo:'capa',nome:'Metrópole neon',descricao:'Desbloqueie Sua voz na comunidade.',raridade:'rara',conquista:'primeira-publicacao',imagem:arte('02-metropole-chuva')},
 {id:'astral',tipo:'capa',nome:'Observatório astral',descricao:'Alcance o nível 20.',raridade:'epica',nivel:20,imagem:arte('08-observatorio-astral')},
 {id:'amanhecer',tipo:'capa',nome:'Dragões do amanhecer',descricao:'Desbloqueie Presença lendária.',raridade:'lendaria',conquista:'presenca-lendaria',imagem:arte('10-dragoes-do-amanhecer')},
 {id:'essencial',tipo:'moldura',nome:'Essencial',descricao:'Acabamento original do perfil.',raridade:'comum'},
 {id:'prisma',tipo:'moldura',nome:'Prisma',descricao:'Desbloqueie Uma coleção só sua.',raridade:'rara',conquista:'primeira-colecao'},
 {id:'vinculo',tipo:'moldura',nome:'Laço estelar',descricao:'Desbloqueie Primeiro vínculo.',raridade:'rara',conquista:'primeiro-vinculo'},
 {id:'soberana',tipo:'moldura',nome:'Soberana',descricao:'Alcance o nível 20.',raridade:'epica',nivel:20},
 {id:'eterna',tipo:'moldura',nome:'Eterna',descricao:'Alcance o nível 50.',raridade:'lendaria',nivel:50},
 {id:'brisa',tipo:'aura',nome:'Brisa',descricao:'Movimento discreto de luz.',raridade:'comum'},
 {id:'orbitas',tipo:'aura',nome:'Órbitas',descricao:'Desbloqueie Primeiro desafio.',raridade:'rara',conquista:'primeiro-jogo'},
 {id:'constelacao',tipo:'aura',nome:'Constelação',descricao:'Desbloqueie A casa é sua.',raridade:'epica',conquista:'anfitriao'},
 {id:'aurora',tipo:'aura',nome:'Aurora lendária',descricao:'Desbloqueie Presença lendária.',raridade:'lendaria',conquista:'presenca-lendaria'},
];
export function recompensaPerfil(tipo: TipoRecompensaPerfil, id: string) {
 return recompensasPerfil.find(item => item.tipo === tipo && item.id === id);
}
/** Fallback de apresentação; a autorização para equipar pertence ao servidor. */
export function visualDoPerfil(perfil: { visual?: VisualPerfil; banner?: string }): VisualPerfil {
 const entrada=perfil.visual || {...visualPerfilPadrao,capa:perfil.banner?'pessoal':'origem'};
 return Object.fromEntries((['capa','moldura','aura'] as const).map(tipo=>[tipo,recompensaPerfil(tipo,entrada[tipo])?entrada[tipo]:visualPerfilPadrao[tipo]])) as VisualPerfil;
}
