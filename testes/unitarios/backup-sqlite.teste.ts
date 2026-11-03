import { describe, expect, it } from 'vitest';
import {
  caminhoDoSqlite,
  nomeDoBackup,
  validarDiretorioBackup
} from '../../src/lib/servidor/banco/backup-sqlite';

describe('backup SQLite de produção', () => {
  it('só aceita URL file: com caminho absoluto e sem parâmetros', () => {
    expect(caminhoDoSqlite('file:/data/yokira.db')).toBe('/data/yokira.db');
    expect(() => caminhoDoSqlite('postgres://localhost/yokira')).toThrow('SQLite');
    expect(() => caminhoDoSqlite('file://servidor/banco.db')).toThrow('inválida');
    expect(() => caminhoDoSqlite('file:/data/yokira.db?modo=unsafe')).toThrow('inválida');
  });

  it('recusa backup dentro do banco ou em diretório relativo', () => {
    expect(validarDiretorioBackup('/data/yokira.db', '/data/backups')).toBe('/data/backups');
    expect(() => validarDiretorioBackup('/data/yokira.db', 'backups')).toThrow('absoluto');
    expect(() => validarDiretorioBackup('/data/yokira.db', '/data')).toThrow('não pode conter');
  });

  it('gera nome sem caracteres problemáticos e sem entrada arbitrária', () => {
    expect(nomeDoBackup(new Date('2026-11-03T08:00:00.000Z'))).toBe(
      'yokira-2026-11-03T08-00-00-000Z.sqlite'
    );
  });
});
