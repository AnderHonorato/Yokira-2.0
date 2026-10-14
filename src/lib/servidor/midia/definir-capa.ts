// Arquivo: src/lib/servidor/midia/definir-capa.ts
// Uma capa pode vir de dois lugares: uma imagem enviada ou um quadro do proprio video.
// Os dois caminhos terminam no mesmo lugar — bytes gravados e uma URL — entao a
// escolha mora aqui e nao espalhada por cada acao do painel.

import { banco } from '../banco/cliente.js';
import { ErroDeCapa, gravarCapa } from './capas.js';
import { extrairQuadro } from './quadro-de-video.js';
import { TAMANHO_MAXIMO_DA_IMAGEM } from './imagens.js';

export interface OrigemDaCapa {
  /** Imagem enviada no formulario, quando houver. */
  imagem: File | null;
  /** Episodio de onde tirar o quadro, quando a origem for o video. */
  episodioId: string | null;
  /** Em que segundo do video recortar. */
  segundo: number;
}

/** Grava a capa e devolve a URL publica. Lanca ErroDeCapa com texto pra tela. */
export async function resolverCapa(origem: OrigemDaCapa): Promise<string> {
  // A imagem ganha quando as duas vem: ela ja esta aqui e nao depende do ffmpeg.
  if (origem.imagem && origem.imagem.size > 0) {
    if (origem.imagem.size > TAMANHO_MAXIMO_DA_IMAGEM) {
      throw new ErroDeCapa('A imagem está acima de 8 MB.');
    }
    return gravarCapa(Buffer.from(await origem.imagem.arrayBuffer()));
  }

  if (!origem.episodioId) throw new ErroDeCapa('Escolha uma imagem ou um episódio.');

  const arquivo = await banco.arquivoMidia.findFirst({
    where: { episodioId: origem.episodioId },
    orderBy: { criadoEm: 'desc' },
    select: { caminho: true }
  });

  if (!arquivo) {
    throw new ErroDeCapa('Esse episódio ainda não tem vídeo para recortar a capa.');
  }

  const quadro = await extrairQuadro(arquivo.caminho, origem.segundo).catch((erro) => {
    throw new ErroDeCapa(erro instanceof Error ? erro.message : 'Falha ao recortar o quadro.');
  });

  return gravarCapa(quadro);
}

/** Le os campos do formulario de capa, iguais nos tres lugares que usam isso. */
export function lerOrigemDoFormulario(formulario: FormData): OrigemDaCapa {
  const imagem = formulario.get('imagem');
  const episodioId = String(formulario.get('episodioDaCapa') ?? '').trim();

  return {
    imagem: imagem instanceof File ? imagem : null,
    episodioId: episodioId === '' ? null : episodioId,
    segundo: Number(formulario.get('segundo') ?? 0)
  };
}
