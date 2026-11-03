// Pré-voo do serviço combinado de vídeo: rejeita configuração insegura em produção.

import { isAbsolute, resolve, sep } from 'node:path';

export function pendenciasDeProducao(env: NodeJS.ProcessEnv): string[] {
  if (env.NODE_ENV !== 'production') return [];

  const problemas: string[] = [];
  const segredo = env.SEGREDO_SESSAO?.trim() ?? '';
  if (
    segredo.length < 32 ||
    segredo.includes('troque-este-valor') ||
    segredo.includes('somente-para-ci')
  ) {
    problemas.push('Configure SEGREDO_SESSAO com pelo menos 32 caracteres aleatórios.');
  }

  try {
    const origem = new URL(env.ORIGIN ?? '');
    if (origem.protocol !== 'https:' || origem.origin !== env.ORIGIN) {
      problemas.push('ORIGIN precisa ser a origem HTTPS pública, sem caminho.');
    }
  } catch {
    problemas.push('ORIGIN não foi configurada com um domínio HTTPS válido.');
  }

  if (env.YOKIRA_MODO_TESTE_E2E === '1') {
    problemas.push('YOKIRA_MODO_TESTE_E2E não pode ser habilitado em produção.');
  }

  // No provedor atual SQLite/originais/HLS estão em um único volume persistente.
  const volume = env.YOKIRA_VOLUME_PERSISTENTE || env.RAILWAY_VOLUME_MOUNT_PATH;
  if (!volume || !isAbsolute(volume)) {
    problemas.push('Informe o caminho absoluto do volume persistente de dados.');
    return problemas;
  }
  const raiz = resolve(volume);
  for (const variavel of ['PASTA_UPLOADS', 'PASTA_HLS'] as const) {
    const caminho = env[variavel];
    if (!caminho || !isAbsolute(caminho) || !resolve(caminho).startsWith(raiz + sep)) {
      problemas.push(`${variavel} deve estar dentro do volume persistente.`);
    }
  }

  const banco = env.DATABASE_URL;
  if (!banco?.startsWith('file:') || !banco.includes(`${raiz}/`)) {
    problemas.push('DATABASE_URL precisa apontar para o SQLite no volume persistente.');
  }

  return problemas;
}
