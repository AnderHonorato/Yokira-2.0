// Persistência simples em arquivos JSON dentro de src/dados (troque por banco real depois)
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const pastaDados = join(dirname(fileURLToPath(import.meta.url)), '..', 'dados');
export const pastaUploads = join(pastaDados, '..', '..', 'uploads');
mkdirSync(pastaUploads, { recursive: true });

const timers = new Map();
export function lerJSON(nome, padrao) {
  const caminho = join(pastaDados, nome);
  if (!existsSync(caminho)) return structuredClone(padrao);
  try { return JSON.parse(readFileSync(caminho, 'utf8')); } catch { return structuredClone(padrao); }
}
// Grava com atraso curto para juntar várias alterações seguidas
export function salvarJSON(nome, dados) {
  clearTimeout(timers.get(nome));
  timers.set(nome, setTimeout(() => writeFileSync(join(pastaDados, nome), JSON.stringify(dados, null, 2)), 150));
}
