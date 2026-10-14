// Arquivo: src/routes/admin/titulos/[id]/+page.server.ts
// Edicao do titulo e de tudo que pendura nele. As acoes que APAGAM nao estao aqui:
// vao pelo /api/admin, que exige o token da dupla confirmacao.

import { error, fail } from '@sveltejs/kit';
import {
  atualizarEpisodio,
  definirCapaDoTitulo,
  definirMiniaturaDoEpisodio,
  atualizarTitulo,
  criarEpisodio,
  criarTemporada,
  ErroDeAdministracao,
  lerTituloDoPainel
} from '$servidor/banco/administracao';
import { listarGeneros } from '$servidor/banco/catalogo';
import { registrarAcaoAdministrativa } from '$servidor/autenticacao/confirmacao';
import { exigirPapel } from '$servidor/permissoes/papeis';
import { lerOrigemDoFormulario, resolverCapa } from '$servidor/midia/definir-capa';
import { executarLote, lerLoteDoFormulario, resumoDoLote } from '$servidor/lote-de-episodios';
import {
  lerDadosDeTitulo,
  validarDataDeEstreia,
  validarDuracaoEmMinutos,
  validarNumeroDeEpisodio,
  validarNumeroDeTemporada
} from '$lib/validacoes/administracao';
import { ErroDeValidacao, exigirTexto } from '$lib/validacoes/erro-validacao';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const [titulo, generos] = await Promise.all([lerTituloDoPainel(params.id), listarGeneros()]);
  if (!titulo) throw error(404, 'Título não encontrado.');
  return { titulo, generos };
};

/** Roda a acao traduzindo os erros conhecidos em fail(400) em vez de 500. */
async function comErroTratado<T>(executar: () => Promise<T>) {
  try {
    return await executar();
  } catch (erro) {
    if (erro instanceof ErroDeValidacao || erro instanceof ErroDeAdministracao) {
      return fail(400, { mensagem: erro.message });
    }
    throw erro;
  }
}

export const actions: Actions = {
  salvar: async ({ request, params, locals }) => {
    exigirPapel(locals.usuario?.papel, 'EDITOR');
    const formulario = await request.formData();

    return comErroTratado(async () => {
      await atualizarTitulo(
        params.id,
        lerDadosDeTitulo(formulario),
        formulario.getAll('generos').map(String)
      );
      await registrarAcaoAdministrativa(locals.usuario!.id, 'editar-titulo', params.id);
      return { mensagem: 'Título salvo.' };
    });
  },

  criarTemporada: async ({ request, params, locals }) => {
    exigirPapel(locals.usuario?.papel, 'EDITOR');
    const formulario = await request.formData();

    return comErroTratado(async () => {
      const numero = validarNumeroDeTemporada(formulario.get('numero'));
      const temporada = await criarTemporada(
        params.id,
        numero,
        exigirTexto(formulario.get('nome'), 'nome', 80)
      );
      await registrarAcaoAdministrativa(locals.usuario!.id, 'criar-temporada', temporada.id);
      return { mensagem: `Temporada ${numero} criada.` };
    });
  },

  criarEpisodio: async ({ request, locals }) => {
    exigirPapel(locals.usuario?.papel, 'EDITOR');
    const formulario = await request.formData();

    return comErroTratado(async () => {
      const numero = validarNumeroDeEpisodio(formulario.get('numero'));
      const episodio = await criarEpisodio(
        exigirTexto(formulario.get('temporadaId'), 'temporadaId', 60),
        numero,
        exigirTexto(formulario.get('nome'), 'nome', 160),
        validarDuracaoEmMinutos(formulario.get('duracao')) * 60,
        validarDataDeEstreia(formulario.get('estreia'))
      );
      await registrarAcaoAdministrativa(locals.usuario!.id, 'criar-episodio', episodio.id);
      return { mensagem: `Episódio ${numero} criado.` };
    });
  },

  criarEpisodiosEmLote: async ({ request, locals }) => {
    exigirPapel(locals.usuario?.papel, 'EDITOR');
    const formulario = await request.formData();

    return comErroTratado(async () => {
      const lote = lerLoteDoFormulario(formulario);
      exigirTexto(lote.temporadaId, 'temporadaId', 60);

      if (lote.plano.length === 0) {
        return { mensagem: 'Informe a quantidade, cole os links ou escolha os arquivos.' };
      }

      const resultado = await executarLote(lote.temporadaId, lote.plano, lote.arquivos);
      await registrarAcaoAdministrativa(
        locals.usuario!.id,
        'criar-episodios-em-lote',
        lote.temporadaId,
        String(resultado.criados)
      );
      return { mensagem: resumoDoLote(resultado) };
    });
  },

  // Uma acao para as tres capas: poster, arte do topo e miniatura de episodio. Sao a
  // mesma pergunta com alvos diferentes, e duas acoes quase iguais divergiriam.
  definirCapa: async ({ request, locals, params }) => {
    exigirPapel(locals.usuario?.papel, 'EDITOR');
    const formulario = await request.formData();

    return comErroTratado(async () => {
      const alvo = String(formulario.get('alvo') ?? 'poster');
      const origem = lerOrigemDoFormulario(formulario);

      if (alvo === 'episodio') {
        const id = exigirTexto(formulario.get('episodioId'), 'episodioId', 60);
        // Sem episodio escolhido, o quadro vem do video do proprio episodio.
        const url = await resolverCapa({ ...origem, episodioId: origem.episodioId ?? id });
        await definirMiniaturaDoEpisodio(id, url);
        await registrarAcaoAdministrativa(locals.usuario!.id, 'definir-miniatura', id);
        return { mensagem: 'Miniatura do episódio trocada.' };
      }

      const url = await resolverCapa(origem);
      await definirCapaDoTitulo(params.id, alvo === 'hero' ? 'hero' : 'poster', url);
      await registrarAcaoAdministrativa(locals.usuario!.id, `definir-capa-${alvo}`, params.id);
      return { mensagem: alvo === 'hero' ? 'Arte do topo trocada.' : 'Pôster trocado.' };
    });
  },

  salvarEpisodio: async ({ request, locals }) => {
    exigirPapel(locals.usuario?.papel, 'EDITOR');
    const formulario = await request.formData();

    return comErroTratado(async () => {
      const id = exigirTexto(formulario.get('episodioId'), 'episodioId', 60);
      await atualizarEpisodio(
        id,
        validarNumeroDeEpisodio(formulario.get('numero')),
        exigirTexto(formulario.get('nome'), 'nome', 160),
        validarDuracaoEmMinutos(formulario.get('duracao')) * 60,
        validarDataDeEstreia(formulario.get('estreia'))
      );
      await registrarAcaoAdministrativa(locals.usuario!.id, 'editar-episodio', id);
      return { mensagem: 'Episódio salvo.' };
    });
  }
};
