// Arquivo: testes/integracao/persistencia.teste.ts
// Prova que lista, progresso e avaliacao sobrevivem — nada guardado so na memoria do navegador.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarBancoDeTeste, type BancoDeTeste } from './preparar-banco';

let ambiente: BancoDeTeste;
let usuarioId = '';
let tituloId = '';
let episodioId = '';

beforeAll(async () => {
  ambiente = criarBancoDeTeste();
  const { banco } = ambiente;

  const usuario = await banco.usuario.create({
    data: { email: 'teste@yokira.local', nome: 'Teste', senhaHash: 'x' }
  });
  usuarioId = usuario.id;

  const titulo = await banco.titulo.create({
    data: { slug: 'titulo-de-teste', nome: 'Título de Teste', sinopse: 'Sinopse.', ano: 2024 }
  });
  tituloId = titulo.id;

  const temporada = await banco.temporada.create({
    data: { tituloId, numero: 1, nome: 'Temporada 1' }
  });
  const episodio = await banco.episodio.create({
    data: { temporadaId: temporada.id, numero: 1, nome: 'Piloto', duracaoSegundos: 1380 }
  });
  episodioId = episodio.id;
}, 120_000);

afterAll(async () => ambiente.encerrar());

describe('minha lista', () => {
  it('alterna e persiste', async () => {
    const { banco } = ambiente;

    await banco.itemLista.create({ data: { usuarioId, tituloId } });
    expect(await banco.itemLista.count({ where: { usuarioId } })).toBe(1);

    await banco.itemLista.delete({ where: { usuarioId_tituloId: { usuarioId, tituloId } } });
    expect(await banco.itemLista.count({ where: { usuarioId } })).toBe(0);
  });

  it('nao duplica o mesmo titulo', async () => {
    const { banco } = ambiente;
    await banco.itemLista.create({ data: { usuarioId, tituloId } });
    await expect(banco.itemLista.create({ data: { usuarioId, tituloId } })).rejects.toThrow();
    await banco.itemLista.delete({ where: { usuarioId_tituloId: { usuarioId, tituloId } } });
  });
});

describe('progresso', () => {
  it('retoma de onde parou', async () => {
    const { banco } = ambiente;

    await banco.progresso.upsert({
      where: { usuarioId_episodioId: { usuarioId, episodioId } },
      create: { usuarioId, episodioId, segundos: 300 },
      update: { segundos: 300 }
    });

    const guardado = await banco.progresso.findUnique({
      where: { usuarioId_episodioId: { usuarioId, episodioId } }
    });
    expect(guardado?.segundos).toBe(300);
  });
});

describe('avaliacao', () => {
  it('uma nota por usuario, sobrescrita no upsert', async () => {
    const { banco } = ambiente;

    await banco.avaliacao.upsert({
      where: { usuarioId_tituloId: { usuarioId, tituloId } },
      create: { usuarioId, tituloId, nota: 7 },
      update: { nota: 7 }
    });
    await banco.avaliacao.upsert({
      where: { usuarioId_tituloId: { usuarioId, tituloId } },
      create: { usuarioId, tituloId, nota: 9 },
      update: { nota: 9 }
    });

    const avaliacoes = await banco.avaliacao.findMany({ where: { tituloId } });
    expect(avaliacoes).toHaveLength(1);
    expect(avaliacoes[0].nota).toBe(9);
  });
});

describe('audiencia', () => {
  it('so conta sinal dentro da janela de 90s', async () => {
    const { banco } = ambiente;

    await banco.sessaoAssistindo.create({
      data: { episodioId, chaveAnonima: 'recente', ultimoSinal: new Date() }
    });
    await banco.sessaoAssistindo.create({
      data: {
        episodioId,
        chaveAnonima: 'antigo',
        ultimoSinal: new Date(Date.now() - 200_000)
      }
    });

    const vivos = await banco.sessaoAssistindo.count({
      where: { episodioId, ultimoSinal: { gte: new Date(Date.now() - 90_000) } }
    });
    expect(vivos).toBe(1);
  });
});
