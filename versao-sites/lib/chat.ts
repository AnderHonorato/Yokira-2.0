import type {PessoaSocial} from './social';
export type ConviteChat={id:string;titulo:string;participantes:number;capacidade:number;trancada:boolean;encerrada:boolean;participante:boolean};
export type MensagemChat={id:string;corpo:string;criadoEm:number;autor:PessoaSocial;imagem:string|null;sala:ConviteChat|null};
export type PainelChat={mensagens:MensagemChat[];servidorEm:number};
