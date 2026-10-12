// Senhas com scrypt e token assinado com HMAC (sem dependências externas)
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pastaDados } from './arquivo.js';

const arquivoSegredo = join(pastaDados, 'segredo.txt');
if (!process.env.SEGREDO && !existsSync(arquivoSegredo)) writeFileSync(arquivoSegredo, randomBytes(32).toString('hex'));
const SEGREDO = process.env.SEGREDO || readFileSync(arquivoSegredo, 'utf8');
const VALIDADE = 1000 * 60 * 60 * 24 * 30; // 30 dias

export function gerarHash(senha) {
  const sal = randomBytes(16).toString('hex');
  return `${sal}:${scryptSync(senha, sal, 64).toString('hex')}`;
}
export function conferirSenha(senha, salvo) {
  const [sal, hash] = salvo.split(':');
  const teste = scryptSync(senha, sal, 64);
  return timingSafeEqual(teste, Buffer.from(hash, 'hex'));
}

const assinar = (dados) => createHmac('sha256', SEGREDO).update(dados).digest('base64url');
export function criarToken(usuarioId) {
  const corpo = Buffer.from(JSON.stringify({ id: usuarioId, exp: Date.now() + VALIDADE })).toString('base64url');
  return `${corpo}.${assinar(corpo)}`;
}
export function lerToken(token) {
  if (!token) return null;
  const [corpo, assinatura] = token.split('.');
  if (!corpo || assinatura !== assinar(corpo)) return null;
  try {
    const dados = JSON.parse(Buffer.from(corpo, 'base64url').toString());
    return dados.exp > Date.now() ? dados.id : null;
  } catch { return null; }
}
