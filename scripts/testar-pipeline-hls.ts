// Teste de integração REAL no contêiner: mídia sintética -> banco -> worker -> HLS.
// Nunca usa vídeos de terceiros nem expõe o título de teste no catálogo.
// Execute apenas em ambiente isolado: YOKIRA_TESTE_PIPELINE=1 npm run video:teste-integrado.

import 'dotenv/config';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { banco } from '../src/lib/servidor/banco/cliente.js';
import { pastaDeHls } from '../src/lib/servidor/midia/caminhos.js';
import { enfileirarArquivo } from '../src/lib/servidor/processamento/fila-video.js';

const executar = promisify(execFile);
const TEMPO_LIMITE_MS = 180_000;

if (process.env.YOKIRA_TESTE_PIPELINE !== '1') {
  throw new Error('A validação integrada exige YOKIRA_TESTE_PIPELINE=1 em ambiente isolado.');
}
if (!process.env.PASTA_UPLOADS) {
  throw new Error('Configure PASTA_UPLOADS para o volume de teste.');
}
if (!process.env.DATABASE_URL?.match(/^file:\/[^?]*(teste|test|pipeline)[^/]*\.sqlite$/i)) {
  throw new Error('Teste HLS bloqueado: o banco precisa ser SQLite isolado de teste.');
}
if (!process.env.YOKIRA_VOLUME_PERSISTENTE?.startsWith('/data')) {
  throw new Error('Execute o teste apenas no volume temporário /data do contêiner.');
}

const codigo = randomUUID().replaceAll('-', '');
const caminho = join(process.env.PASTA_UPLOADS, `pipeline-${codigo}.mp4`);
let tituloId: string | null = null;
let arquivoId: string | null = null;
let terminou = false;

const pausa = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

try {
  await mkdir(process.env.PASTA_UPLOADS, { recursive: true });

  // Arquivo autoral de 2,5 segundos, com som e vídeo suficientes para FFmpeg.
  await executar(
    process.env.CAMINHO_FFMPEG ?? 'ffmpeg',
    [
      '-nostdin',
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-f',
      'lavfi',
      '-i',
      'testsrc2=size=320x180:rate=12:duration=2.5',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=440:duration=2.5',
      '-shortest',
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '64k',
      caminho
    ],
    { timeout: 30_000 }
  );
  const informacao = await stat(caminho);
  if (informacao.size < 1024) throw new Error('Vídeo sintético está vazio.');

  const titulo = await banco.titulo.create({
    data: {
      nome: 'Teste temporário de transcodificação HLS',
      slug: `pipeline-hls-${codigo}`,
      ano: 2026,
      sinopse: 'Título sintético exclusivo da validação isolada.',
      situacao: 'RASCUNHO',
      temporadas: {
        create: {
          numero: 1,
          nome: 'Temporada de validação',
          episodios: { create: { numero: 1, nome: 'Episódio sintético', duracaoSegundos: 3 } }
        }
      }
    },
    include: { temporadas: { include: { episodios: true } } }
  });
  tituloId = titulo.id;
  const episodioId = titulo.temporadas[0]?.episodios[0]?.id;
  if (!episodioId) throw new Error('Falha na criação do episódio de teste.');

  const arquivo = await banco.arquivoMidia.create({
    data: { episodioId, caminho, tamanhoBytes: BigInt(informacao.size) }
  });
  arquivoId = arquivo.id;

  const trabalhoId = await enfileirarArquivo(arquivo.id);
  console.log('Pipeline HLS: arquivo sintético enfileirado.');

  // O trabalhador HLS já está rodando no contêiner, em processo separado.
  const limite = Date.now() + TEMPO_LIMITE_MS;
  while (Date.now() < limite) {
    const trabalho = await banco.trabalhoProcessamento.findUnique({
      where: { id: trabalhoId },
      select: { situacao: true, progresso: true, mensagem: true }
    });
    if (trabalho?.situacao === 'FALHOU') {
      terminou = true;
      throw new Error(`FFmpeg falhou: ${trabalho.mensagem ?? 'sem detalhes'}`);
    }
    if (trabalho?.situacao === 'CONCLUIDO') {
      terminou = true;
      if (trabalho.progresso !== 100) throw new Error('HLS finalizado sem 100% de progresso.');
      break;
    }
    await pausa(1500);
  }
  if (!terminou) throw new Error('Tempo esgotado esperando o trabalhador HLS.');

  const variantes = await banco.varianteHls.findMany({
    where: { arquivoId: arquivo.id },
    orderBy: { altura: 'asc' }
  });
  const alturas = variantes.map((v) => v.altura);
  if (JSON.stringify(alturas) !== JSON.stringify([360, 720, 1080]))
    throw new Error(`Variantes ausentes: ${JSON.stringify(alturas)}`);

  const pasta = join(pastaDeHls(), arquivo.id);
  const mestre = await readFile(join(pasta, 'mestre.m3u8'), 'utf8');
  if (!mestre.startsWith('#EXTM3U')) throw new Error('Manifesto mestre inválido.');

  for (const altura of alturas) {
    if (!mestre.includes(`${altura}p.m3u8`)) throw new Error('Manifesto mestre incompleto.');
    const manifest = await readFile(join(pasta, `${altura}p.m3u8`), 'utf8');
    if (!manifest.includes('#EXTINF:') || !manifest.includes('#EXT-X-ENDLIST')) {
      throw new Error(`Playlist ${altura}p não é VOD completo.`);
    }
    const arquivos = await readdir(pasta);
    const segmento = arquivos.find(
      (nome) => nome.startsWith(`${altura}p_`) && nome.endsWith('.ts')
    );
    if (!segmento) throw new Error(`Segmentos ausentes em ${altura}p.`);
    if ((await stat(join(pasta, segmento))).size < 128)
      throw new Error(`Segmento ${altura}p inválido.`);
  }

  console.log('Pipeline HLS validado: 360p, 720p e 1080p, playlists e segmentos reais.');
} finally {
  // Se expirou o limite, mantém arquivos e registros enquanto o worker ainda usa a mídia.
  // Em CI todo o volume é descartado ao encerrar o contêiner.
  if (terminou) {
    if (tituloId) await banco.titulo.delete({ where: { id: tituloId } }).catch(() => {});
    if (arquivoId) {
      await rm(join(pastaDeHls(), arquivoId), { recursive: true, force: true }).catch(() => {});
    }
    await rm(caminho, { force: true }).catch(() => {});
  }
  await banco.$disconnect();
}
