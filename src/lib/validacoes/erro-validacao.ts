// Arquivo: src/lib/validacoes/erro-validacao.ts
// Validacao escrita a mao em vez de Zod: sao poucos formatos e economiza ~14kB no bundle.

export class ErroDeValidacao extends Error {
  readonly campo: string;

  constructor(campo: string, mensagem: string) {
    super(mensagem);
    this.name = 'ErroDeValidacao';
    this.campo = campo;
  }
}

export function exigirTexto(valor: unknown, campo: string, maximo = 500): string {
  if (typeof valor !== 'string' || valor.trim().length === 0) {
    throw new ErroDeValidacao(campo, `O campo ${campo} e obrigatorio.`);
  }
  const limpo = valor.trim();
  if (limpo.length > maximo) {
    throw new ErroDeValidacao(campo, `O campo ${campo} passou de ${maximo} caracteres.`);
  }
  return limpo;
}

export function exigirInteiro(
  valor: unknown,
  campo: string,
  minimo = 0,
  maximo = 1_000_000
): number {
  const numero = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isFinite(numero) || !Number.isInteger(numero)) {
    throw new ErroDeValidacao(campo, `O campo ${campo} precisa ser um numero inteiro.`);
  }
  if (numero < minimo || numero > maximo) {
    throw new ErroDeValidacao(campo, `O campo ${campo} precisa estar entre ${minimo} e ${maximo}.`);
  }
  return numero;
}
