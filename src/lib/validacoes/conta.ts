// Arquivo: src/lib/validacoes/conta.ts
// Regras de cadastro e login. Mesmo arquivo usado no cliente e no servidor: a mensagem
// que aparece no formulario e exatamente a que o servidor aplicaria.

import { ErroDeValidacao, exigirTexto } from './erro-validacao.js';

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const TAMANHO_MINIMO_DA_SENHA = 10;

export function validarEmail(valor: unknown): string {
  const email = exigirTexto(valor, 'email', 160).toLowerCase();
  if (!FORMATO_EMAIL.test(email)) {
    throw new ErroDeValidacao('email', 'Informe um e-mail valido.');
  }
  return email;
}

export function validarSenha(valor: unknown): string {
  const senha = typeof valor === 'string' ? valor : '';
  if (senha.length < TAMANHO_MINIMO_DA_SENHA) {
    throw new ErroDeValidacao(
      'senha',
      `A senha precisa de pelo menos ${TAMANHO_MINIMO_DA_SENHA} caracteres.`
    );
  }
  if (!/[a-zA-Z]/.test(senha) || !/[0-9]/.test(senha)) {
    throw new ErroDeValidacao('senha', 'A senha precisa misturar letras e numeros.');
  }
  return senha;
}

export function validarNome(valor: unknown): string {
  const nome = exigirTexto(valor, 'nome', 80);
  if (nome.length < 2) throw new ErroDeValidacao('nome', 'O nome esta curto demais.');
  return nome;
}
