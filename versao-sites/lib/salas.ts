export type EstadoSala = { pausado: boolean; posicao: number; revisao: number; atualizadoEm: number; servidorEm: number };
export type SalaResumo = { id: string; tituloId: string; episodioId: string; donoId: string; modo: 'dupla' | 'grupo'; participantes: number; readonly trancada: boolean; criadoEm: number };
export type MembroSala = { usuarioId: string; nome: string; dono: boolean };
export type MensagemSala = { id: string; autorId: string; nome: string; corpo: string; criadoEm: number };
export type FonteSala = { id: string; nome: string; tipo: 'direto' | 'drive' | 'incorporado'; url: string };
export type SalaDetalhe = SalaResumo & { convite?: string; membros: MembroSala[]; mensagens: MensagemSala[]; estado: EstadoSala; episodio: { titulo: string; poster: string; fontes: FonteSala[] } };
export type SincronizacaoPlayer = { estado: EstadoSala; dono: boolean; onControle: (pausado: boolean, posicao: number, revisao: number) => void };
