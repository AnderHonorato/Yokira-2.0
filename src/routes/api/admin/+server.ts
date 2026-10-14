// Arquivo: src/routes/api/admin/+server.ts
// Passo 2 das acoes destrutivas do painel. Exige o token de uso unico emitido no
// /api/confirmacao: quem chamar isto no curl, sem passar pelo dialogo, leva 400.
//
// Toda acao consumada vira linha no RegistroAdministrativo — auditoria depois de
// um "quem apagou isso?" e o que separa um painel de um estrago anonimo.

import { error, json } from '@sveltejs/kit';
import { banco } from '$servidor/banco/cliente';
import {
  consumirTokenDeConfirmacao,
  registrarAcaoAdministrativa
} from '$servidor/autenticacao/confirmacao';
import { ErroDeAdministracao } from '$servidor/banco/administracao';
import { trocarPapel } from '$servidor/banco/administracao-pessoas';
import { exigirPapel } from '$servidor/permissoes/papeis';
import { exigirTexto } from '$lib/validacoes/erro-validacao';
import { validarPapel } from '$lib/validacoes/administracao';
import { ErroDeValidacao } from '$lib/validacoes/erro-validacao';
import type { Papel } from '$servidor/banco/gerado/enums';
import type { RequestHandler } from './$types';

/** Papel minimo exigido por acao. Tabela em vez de if espalhado. */
const PAPEL_EXIGIDO: Record<string, Papel> = {
  'excluir-titulo': 'EDITOR',
  'excluir-temporada': 'EDITOR',
  'excluir-episodio': 'EDITOR',
  'despublicar-conteudo': 'EDITOR',
  'remover-usuario': 'ADMINISTRADOR',
  'trocar-papel': 'ADMINISTRADOR'
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const usuario = locals.usuario;
  if (!usuario) throw error(401, 'Precisa entrar na conta.');

  const corpo = (await request.json()) as Record<string, unknown>;
  const acao = exigirTexto(corpo.acao, 'acao', 40);
  const alvo = exigirTexto(corpo.alvo, 'alvo', 60);
  const token = exigirTexto(corpo.tokenConfirmacao, 'tokenConfirmacao', 120);

  const minimo = PAPEL_EXIGIDO[acao];
  if (!minimo) throw error(400, 'Ação desconhecida.');
  exigirPapel(usuario.papel, minimo);

  // O alvo entra na conferencia: token emitido pra apagar o titulo A nao apaga o B.
  await consumirTokenDeConfirmacao(usuario.id, acao, token, alvo);

  try {
    switch (acao) {
      case 'excluir-titulo':
        await banco.titulo.delete({ where: { id: alvo } });
        break;
      case 'excluir-temporada':
        await banco.temporada.delete({ where: { id: alvo } });
        break;
      case 'excluir-episodio':
        await banco.episodio.delete({ where: { id: alvo } });
        break;
      case 'despublicar-conteudo':
        await banco.titulo.update({ data: { situacao: 'DESPUBLICADO' }, where: { id: alvo } });
        break;
      case 'remover-usuario':
        if (alvo === usuario.id)
          throw new ErroDeAdministracao('Use as configurações para excluir a própria conta.');
        await banco.usuario.delete({ where: { id: alvo } });
        break;
      case 'trocar-papel':
        await trocarPapel(alvo, validarPapel(corpo.papel));
        break;
    }
  } catch (erro) {
    if (erro instanceof ErroDeAdministracao || erro instanceof ErroDeValidacao) {
      throw error(400, erro.message);
    }
    throw erro;
  }

  await registrarAcaoAdministrativa(
    usuario.id,
    acao,
    alvo,
    typeof corpo.papel === 'string' ? corpo.papel : undefined
  );

  return json({ concluido: true });
};
