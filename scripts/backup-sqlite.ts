// Snapshot consistente do SQLite com a API de backup da CLI (não copia o .db a quente).
// Uso: BACKUP_DIRETORIO=/data/backups npm run banco:backup
// O arquivo contém dados pessoais e deve ficar privado, fora do Git e do diretório web.

import 'dotenv/config';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { chmod, mkdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import {
  caminhoDoSqlite,
  nomeDoBackup,
  validarDiretorioBackup
} from '../src/lib/servidor/banco/backup-sqlite.js';

const executar = promisify(execFile);
const banco = caminhoDoSqlite(process.env.DATABASE_URL);
const diretorio = validarDiretorioBackup(banco, process.env.BACKUP_DIRETORIO ?? '');
const nome = nomeDoBackup(new Date());
const destino = join(diretorio, nome);
const parcial = `${destino}.partial`;

async function comandoSqlite(arquivo: string, comando: string): Promise<string> {
  const { stdout } = await executar('sqlite3', ['-batch', arquivo, comando], {
    timeout: 120_000,
    maxBuffer: 1024 * 1024
  });
  return stdout.trim();
}

async function sha256(caminho: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const pedaco of createReadStream(caminho)) hash.update(pedaco);
  return hash.digest('hex');
}

await mkdir(diretorio, { recursive: true, mode: 0o700 });
await chmod(diretorio, 0o700);
try {
  // Caminho gerado pelo servidor, não por entrada do usuário.
  // .backup faz um snapshot transacional mesmo com WAL e escritas concorrentes.
  await comandoSqlite(banco, `.backup '${parcial}'`);
  const integridade = await comandoSqlite(parcial, 'PRAGMA integrity_check;');
  if (integridade !== 'ok') throw new Error('Snapshot falhou na verificação de integridade.');

  await chmod(parcial, 0o600);
  const informacao = await stat(parcial);
  const hash = await sha256(parcial);
  await rename(parcial, destino);

  const manifesto = {
    versao: 1,
    arquivo: nome,
    criadoEm: new Date().toISOString(),
    tamanhoBytes: informacao.size,
    sha256: hash,
    integridade: 'ok'
  };
  await writeFile(`${destino}.json`, JSON.stringify(manifesto, null, 2) + '\n', {
    mode: 0o600,
    flag: 'wx'
  });
  console.log(`Backup íntegro: ${destino} (${informacao.size} bytes, SHA-256 ${hash})`);
} catch (erro) {
  await rm(parcial, { force: true }).catch(() => {});
  throw erro;
}
