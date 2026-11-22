import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { validarMigracoes } from './verificar-migracoes.mjs';

test('aplica todas as migracoes D1 do zero e confere tabelas criticas', () => {
  const resultado = validarMigracoes();
  assert.equal(resultado.arquivos.length, 20);
  assert.match(resultado.arquivos.at(-1), /^0019_/);
  assert.ok(resultado.tabelas.includes('usuarios'));
  assert.ok(resultado.tabelas.includes('episodios'));
  assert.ok(resultado.tabelas.includes('episodio_fontes'));
  assert.equal(resultado.integridade, 'ok');
});

test('informa o arquivo exato ao encontrar SQL invalido', () => {
  const dir = mkdtempSync(join(tmpdir(), 'yokira-migrations-'));
  try {
    writeFileSync(join(dir, '0000_inicio.sql'), 'CREATE TABLE usuarios(id TEXT PRIMARY KEY);');
    writeFileSync(join(dir, '0001_quebrada.sql'), 'CREATE TABLE quebrada (');
    assert.throws(() => validarMigracoes({diretorio: dir, tabelasEsperadas: ['usuarios']}), /0001_quebrada.sql/);
  } finally { rmSync(dir, {recursive: true, force: true}); }
});

test('recusa lacunas de numeracao mesmo quando o SQL e valido', () => {
  const dir = mkdtempSync(join(tmpdir(), 'yokira-migrations-'));
  try {
    writeFileSync(join(dir, '0000_inicio.sql'), 'CREATE TABLE usuarios(id TEXT PRIMARY KEY);');
    writeFileSync(join(dir, '0002_lacuna.sql'), 'CREATE TABLE episodios(id TEXT PRIMARY KEY);');
    assert.throws(() => validarMigracoes({diretorio: dir, tabelasEsperadas: ['usuarios']}), /ausente|sequencia/i);
  } finally { rmSync(dir, {recursive: true, force: true}); }
});

test('recusa banco que nao contenha tabela obrigatoria apos aplicar migrations', () => {
  const dir = mkdtempSync(join(tmpdir(), 'yokira-migrations-'));
  try {
    writeFileSync(join(dir, '0000_inicio.sql'), 'CREATE TABLE usuarios(id TEXT PRIMARY KEY);');
    assert.throws(() => validarMigracoes({diretorio: dir, tabelasEsperadas: ['usuarios','episodios']}), /episodios/);
  } finally { rmSync(dir, {recursive: true, force: true}); }
});
