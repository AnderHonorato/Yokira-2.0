// Arquivo: src/lib/componentes/comum/dialogo-confirmacao.ts
// Regras do passo 2 fora do componente pra dar pra testar sem montar nada.

export interface ExigenciaDoPasso2 {
  /** Palavra que a pessoa precisa digitar (ex.: EXCLUIR). Sem ela, usamos a caixa de marcar. */
  palavraChave?: string;
  rotuloDaCaixa?: string;
}

export function podeConfirmar(
  exigencia: ExigenciaDoPasso2,
  textoDigitado: string,
  caixaMarcada: boolean
): boolean {
  if (exigencia.palavraChave) {
    return textoDigitado.trim().toUpperCase() === exigencia.palavraChave.toUpperCase();
  }
  return caixaMarcada;
}

export function rotuloDoPasso(passo: 1 | 2): string {
  return passo === 1 ? 'Passo 1 de 2' : 'Passo 2 de 2';
}
