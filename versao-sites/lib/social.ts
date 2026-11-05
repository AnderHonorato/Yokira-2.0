import type { ConquistaProgresso } from './conquistas';

export type RelacaoSocial = 'proprio' | 'nenhuma' | 'amigo' | 'recebida' | 'enviada' | 'bloqueado';
export type PessoaSocial = { id: string; nome: string; handle: string; nivel: number; relacao: RelacaoSocial };
export type PerfilSocial = PessoaSocial & {
 bio: string; publico: boolean; mostrarConquistas: boolean; atualizadoEm: number;
 conquistas: ConquistaProgresso[];
};
export type PainelAmizades = {
 amigos: PessoaSocial[]; recebidas: PessoaSocial[]; enviadas: PessoaSocial[];
 bloqueados: PessoaSocial[]; resultados: PessoaSocial[];
};
export type OperacaoAmizade = 'solicitar' | 'aceitar' | 'recusar' | 'cancelar' | 'remover' | 'bloquear' | 'desbloquear';
export type EdicaoPerfil = { nome: string; handle: string; bio: string; publico: boolean; mostrarConquistas: boolean };
