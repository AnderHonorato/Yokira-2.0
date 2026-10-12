// Carrega o catálogo em memória. Se banco.json não existir, gera na hora.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { gerarBanco } from '../dados/gerar.js';

const pastaDados = join(dirname(fileURLToPath(import.meta.url)), '..', 'dados');
const arquivoBanco = join(pastaDados, 'banco.json');
const arquivoComentarios = join(pastaDados, 'comentarios.json');

if (!existsSync(arquivoBanco)) writeFileSync(arquivoBanco, JSON.stringify(gerarBanco(), null, 2));

export const banco = JSON.parse(readFileSync(arquivoBanco, 'utf8'));

const videoPadrao = process.env.VIDEO_PADRAO;
if (videoPadrao) banco.animes.forEach((a) => a.episodios.forEach((ep) => { ep.urlVideo = videoPadrao; }));

export const acharAnime = (slug) => banco.animes.find((a) => a.slug === slug);

// Comentários persistidos em arquivo JSON simples (troque por um banco real depois)
export function lerComentarios() {
  if (!existsSync(arquivoComentarios)) return {};
  return JSON.parse(readFileSync(arquivoComentarios, 'utf8'));
}
export function salvarComentarios(dados) {
  writeFileSync(arquivoComentarios, JSON.stringify(dados, null, 2));
}
