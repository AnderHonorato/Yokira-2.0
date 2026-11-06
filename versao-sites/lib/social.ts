import type { ConquistaProgresso } from './conquistas';

export type RelacaoSocial = 'proprio' | 'nenhuma' | 'amigo' | 'recebida' | 'enviada' | 'bloqueado';
export type PessoaSocial = { id: string; nome: string; handle: string; nivel: number; avatar?: string; relacao: RelacaoSocial };
export type PerfilSocial = PessoaSocial & {
 avatar: string; banner: string; compartilharAtividade: boolean; atividade: AtividadePerfil | null; xp: number; criadoEm: number;
 bio: string; publico: boolean; mostrarConquistas: boolean; atualizadoEm: number;
 conquistas: ConquistaProgresso[];
};
export type AtividadePerfil = { tituloId: string; titulo: string; episodioId: string; episodio: number; atualizadoEm: number };
export type CartaoPerfil = PessoaSocial & { avatar: string; banner: string; acessivel: boolean; conquistas: ConquistaProgresso[]; atividade: AtividadePerfil | null };
export type PainelAmizades = {
 amigos: PessoaSocial[]; recebidas: PessoaSocial[]; enviadas: PessoaSocial[];
 bloqueados: PessoaSocial[]; resultados: PessoaSocial[];
};
export type OperacaoAmizade = 'solicitar' | 'aceitar' | 'recusar' | 'cancelar' | 'remover' | 'bloquear' | 'desbloquear';
export type EdicaoPerfil = { nome: string; handle: string; bio: string; publico: boolean; mostrarConquistas: boolean; avatar?: string; banner?: string; compartilharAtividade?: boolean };
