// O launcher não pode publicar dados em disco efêmero nem aceitar segredo de teste.

import { describe, expect, it } from 'vitest';
import { pendenciasDeProducao } from '../../src/lib/servidor/seguranca/config-producao';

const valores = {
  NODE_ENV: 'production',
  SEGREDO_SESSAO: 's'.repeat(64),
  ORIGIN: 'https://yokira.example',
  DATABASE_URL: 'file:/data/yokira.sqlite',
  PASTA_UPLOADS: '/data/originais',
  PASTA_HLS: '/data/hls',
  RAILWAY_VOLUME_MOUNT_PATH: '/data'
};

describe('pré-voo do serviço de produção', () => {
  it('aceita domínio HTTPS, segredo robusto e volume persistente', () => {
    expect(pendenciasDeProducao(valores)).toEqual([]);
  });

  it('barra credenciais e modos de teste em produção', () => {
    const pendencias = pendenciasDeProducao({
      ...valores,
      SEGREDO_SESSAO: 'troque-este-valor-por-uma-string-longa-e-aleatoria',
      YOKIRA_MODO_TESTE_E2E: '1'
    });
    expect(pendencias.join(' ')).toContain('SEGREDO_SESSAO');
    expect(pendencias.join(' ')).toContain('YOKIRA_MODO_TESTE_E2E');
  });

  it('barra HTTP e banco ou mídia fora do volume', () => {
    const pendencias = pendenciasDeProducao({
      ...valores,
      ORIGIN: 'http://localhost:4000',
      DATABASE_URL: 'file:./dev.db',
      PASTA_UPLOADS: './midia/originais',
      PASTA_HLS: '/tmp/hls'
    });
    const texto = pendencias.join(' ');
    expect(texto).toContain('ORIGIN');
    expect(texto).toContain('DATABASE_URL');
    expect(texto).toContain('PASTA_UPLOADS');
    expect(texto).toContain('PASTA_HLS');
  });

  it('não exige volume remoto para desenvolvimento local', () => {
    expect(pendenciasDeProducao({ NODE_ENV: 'development' })).toEqual([]);
  });
});
