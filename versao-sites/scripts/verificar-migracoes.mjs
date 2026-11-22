import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const diretorioPadrao = new URL('../drizzle/', import.meta.url);
const obrigatorias = ['usuarios', 'episodios', 'episodio_fontes'];

/**
 * Reconstrói o esquema D1 numa instância SQLite descartável.
 * Não lê nem modifica a instância remota do Cloudflare.
 */
export function validarMigracoes({ diretorio = diretorioPadrao, tabelasEsperadas = obrigatorias } = {}) {
  const arquivos = readdirSync(diretorio)
    .filter(nome => /^\d{4}_.+\.sql$/u.test(nome))
    .sort((a, b) => a.localeCompare(b));

  if (!arquivos.length) throw new Error('Nenhuma migracao SQL encontrada.');
  arquivos.forEach((nome, indice) => {
    const numero = Number(nome.slice(0, 4));
    if (numero !== indice) {
      throw new Error(`Sequencia de migracoes invalida: ausente ${String(indice).padStart(4, '0')} antes de ${nome}.`);
    }
  });

  const banco = new DatabaseSync(':memory:');
  try {
    banco.exec('PRAGMA foreign_keys = ON');
    for (const nome of arquivos) {
      // Para caminhos Windows, o caminho recebido pode ser um path ou uma URL.
      const local = diretorio instanceof URL ? fileURLToPath(new URL(nome, diretorio)) : join(diretorio, nome);
      try { banco.exec(readFileSync(local, 'utf8')); }
      catch (erro) {
        throw new Error(`Falha na migracao ${nome}: ${erro.message}`, { cause: erro });
      }
    }

    const tabelas = banco.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(item => item.name);
    for (const nome of tabelasEsperadas) {
      if (!tabelas.includes(nome)) throw new Error(`Tabela obrigatoria ausente apos migracoes: ${nome}`);
    }
    const integridade = banco.prepare('PRAGMA integrity_check').get()?.integrity_check;
    if (integridade !== 'ok') throw new Error(`Falha no PRAGMA integrity_check: ${integridade}`);
    const falhasDeChave = banco.prepare('PRAGMA foreign_key_check').all();
    if (falhasDeChave.length) throw new Error(`Falha em chaves estrangeiras: ${falhasDeChave.length}`);
    return { arquivos, tabelas, integridade };
  } finally { banco.close(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const resultado = validarMigracoes();
    console.log(`D1: ${resultado.arquivos.length} migracoes validadas, ${resultado.tabelas.length} tabelas, integridade ${resultado.integridade}.`);
  } catch (erro) {
    console.error(erro.message);
    process.exitCode = 1;
  }
}
