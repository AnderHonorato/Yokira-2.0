// Arquivo: testes/integracao/midia-hls.teste.ts
// Caminho feliz da midia protegida, com arquivos de verdade no disco: playlist sai
// reescrita e assinada, segmento sai com os bytes certos, e a assinatura de outro
// usuario nao abre nada.
//
// Escreve o HLS a mao porque o ffmpeg nao entra em teste: transcodificar levaria
// minutos e nao e isso que esta sendo testado aqui.

import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GET } from '../../src/routes/midia/hls/[arquivoId]/[recurso]/+server';
import { urlAssinada, VALIDADE_PLAYLIST_MS } from '../../src/lib/servidor/midia/assinatura-hls';

const ARQUIVO_ID = 'arq1234567890ab';
const USUARIO = { id: 'usu1234567890ab', email: 'a@b.c', nome: 'Teste', papel: 'ESPECTADOR' };
const BYTES_DO_SEGMENTO = Buffer.from('conteudo-falso-de-segmento-ts');

let pasta: string;

/** Monta o evento minimo que o handler consome. */
function evento(recurso: string, consulta: string, usuario: unknown, cabecalhos: HeadersInit = {}) {
  const url = new URL(`http://localhost/midia/hls/${ARQUIVO_ID}/${recurso}?${consulta}`);
  return {
    params: { arquivoId: ARQUIVO_ID, recurso },
    url,
    locals: { usuario },
    request: new Request(url, { headers: cabecalhos })
  } as unknown as Parameters<typeof GET>[0];
}

function assinaturaValida(recurso: string, usuarioId = USUARIO.id) {
  const url = urlAssinada({
    arquivoId: ARQUIVO_ID,
    recurso,
    usuarioId,
    expiraEm: Date.now() + VALIDADE_PLAYLIST_MS
  });
  return url.slice(url.indexOf('?') + 1);
}

beforeAll(async () => {
  pasta = await mkdtemp(join(tmpdir(), 'yokira-hls-'));
  process.env.PASTA_HLS = pasta;

  const destino = join(pasta, ARQUIVO_ID);
  await mkdir(destino, { recursive: true });

  await writeFile(
    join(destino, 'mestre.m3u8'),
    '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360\n360p.m3u8\n'
  );
  await writeFile(
    join(destino, '720p.m3u8'),
    '#EXTM3U\n#EXT-X-VERSION:3\n#EXTINF:6.0,\n720p_000.ts\n#EXT-X-ENDLIST\n'
  );
  await writeFile(join(destino, '720p_000.ts'), BYTES_DO_SEGMENTO);
});

afterAll(async () => {
  await rm(pasta, { recursive: true, force: true });
});

describe('entrega de midia assinada', () => {
  it('playlist mestre sai com a variante ja assinada', async () => {
    const resposta = await GET(evento('mestre.m3u8', assinaturaValida('mestre.m3u8'), USUARIO));
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get('content-type')).toContain('mpegurl');
    // Playlist e pessoal: nunca pode cair em cache compartilhado.
    expect(resposta.headers.get('cache-control')).toBe('private, no-store');

    const corpo = await resposta.text();
    expect(corpo).toContain(`/midia/hls/${ARQUIVO_ID}/360p.m3u8?exp=`);
    expect(corpo).toContain('sig=');
    // A tag original continua intacta.
    expect(corpo).toContain('#EXT-X-STREAM-INF:BANDWIDTH=800000');
  });

  it('playlist de variante sai com o segmento assinado', async () => {
    const resposta = await GET(evento('720p.m3u8', assinaturaValida('720p.m3u8'), USUARIO));
    const corpo = await resposta.text();

    expect(corpo).toContain(`/midia/hls/${ARQUIVO_ID}/720p_000.ts?exp=`);
    expect(corpo).toContain('#EXT-X-ENDLIST');
    // O nome cru nao pode sobrar solto numa linha: seria um pedido sem assinatura.
    expect(corpo.split('\n').some((linha) => linha.trim() === '720p_000.ts')).toBe(false);
  });

  it('segmento sai inteiro com os bytes certos', async () => {
    const resposta = await GET(evento('720p_000.ts', assinaturaValida('720p_000.ts'), USUARIO));
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get('content-type')).toBe('video/mp2t');
    expect(resposta.headers.get('content-length')).toBe(String(BYTES_DO_SEGMENTO.length));

    const corpo = Buffer.from(await resposta.arrayBuffer());
    expect(corpo.equals(BYTES_DO_SEGMENTO)).toBe(true);
  });

  it('segmento respeita Range e devolve 206', async () => {
    const resposta = await GET(
      evento('720p_000.ts', assinaturaValida('720p_000.ts'), USUARIO, { range: 'bytes=0-7' })
    );

    expect(resposta.status).toBe(206);
    expect(resposta.headers.get('content-range')).toBe(`bytes 0-7/${BYTES_DO_SEGMENTO.length}`);
    expect(Buffer.from(await resposta.arrayBuffer())).toEqual(BYTES_DO_SEGMENTO.subarray(0, 8));
  });

  it('assinatura de outro usuario nao abre o segmento', async () => {
    const daOutraConta = assinaturaValida('720p_000.ts', 'usuOUTRO12345678');
    await expect(GET(evento('720p_000.ts', daOutraConta, USUARIO))).rejects.toMatchObject({
      status: 403
    });
  });

  it('sem sessao nem chega a olhar a assinatura', async () => {
    await expect(
      GET(evento('720p_000.ts', assinaturaValida('720p_000.ts'), null))
    ).rejects.toMatchObject({ status: 401 });
  });

  it('arquivo que nao existe devolve 404, nao 500', async () => {
    await expect(
      GET(evento('1080p_999.ts', assinaturaValida('1080p_999.ts'), USUARIO))
    ).rejects.toMatchObject({ status: 404 });
  });
});
