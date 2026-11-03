// Limites por rota impedem que o tamanho elevado de vídeo afete o restante do app.

import { describe, expect, it } from 'vitest';
import { conferirLimiteDeRequisicao } from '../../src/lib/servidor/seguranca/limite-requisicao';

describe('limite de requisição', () => {
  it('aceita GET e pequenos formulários comuns', () => {
    expect(conferirLimiteDeRequisicao('GET', '/', new Headers())).toBeNull();
    expect(
      conferirLimiteDeRequisicao('POST', '/entrar', new Headers({ 'content-length': '512' }))
    ).toBeNull();
  });

  it('rejeita corpo grande ou sem tamanho em endpoints comuns', () => {
    expect(
      conferirLimiteDeRequisicao('POST', '/api/social', new Headers({ 'content-length': '9000000' }))
        ?.codigo
    ).toBe(413);
    expect(conferirLimiteDeRequisicao('POST', '/entrar', new Headers())?.codigo).toBe(411);
  });

  it('só libera a rota binária específica para corpos grandes', () => {
    const enorme = new Headers({ 'content-length': '9000000' });
    expect(conferirLimiteDeRequisicao('POST', '/api/admin/enviar-video', enorme)).toBeNull();
    expect(conferirLimiteDeRequisicao('POST', '/admin/enviar', enorme)?.codigo).toBe(413);
    expect(conferirLimiteDeRequisicao('PUT', '/api/admin/enviar-video', enorme)?.codigo).toBe(413);
  });
});
