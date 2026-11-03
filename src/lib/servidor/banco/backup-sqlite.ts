// Caminhos e nomes do backup SQLite: não aceitam esquemas remotos nem diretórios relativos.
import { isAbsolute, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export function caminhoDoSqlite(url: string | undefined): string {
  if (!url?.startsWith('file:')) throw new Error('DATABASE_URL precisa apontar para SQLite.');
  let caminho: string;
  try {
    const parsed = new URL(url);
    if (parsed.host || parsed.search || parsed.hash)
      throw new Error('URL SQLite não deve conter host, query ou fragmento.');
    caminho = fileURLToPath(parsed);
  } catch {
    throw new Error('DATABASE_URL SQLite inválida; use file:/caminho/absoluto.db.');
  }
  if (!isAbsolute(caminho)) throw new Error('O banco precisa de um caminho absoluto.');
  return resolve(caminho);
}

export function validarDiretorioBackup(banco: string, diretorio: string): string {
  if (!isAbsolute(diretorio)) throw new Error('BACKUP_DIRETORIO precisa ser absoluto.');
  const destino = resolve(diretorio);
  if (destino === banco || banco.startsWith(destino + sep))
    throw new Error('O diretório de backup não pode conter o arquivo do banco ativo.');
  return destino;
}

export function nomeDoBackup(agora: Date): string {
  return `yokira-${agora.toISOString().replace(/[:.]/g, '-')}.sqlite`;
}
