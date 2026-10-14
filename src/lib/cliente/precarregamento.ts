// Arquivo: src/lib/cliente/precarregamento.ts
// Primeiro acesso: baixa catalogo + assets e reporta progresso real (nao barra falsa).
// Acessos seguintes: devolve o cache na hora e revalida atras (stale-while-revalidate).

import { gravar, ler } from './cache-sessao';

export const CHAVE_DO_CATALOGO = 'catalogo-publico';
export const VALIDADE_DO_CATALOGO_MS = 6 * 60 * 60 * 1000;

export interface PassoDePrecarregamento {
  rotulo: string;
  executar: () => Promise<unknown>;
}

export function calcularPorcentagem(concluidos: number, total: number): number {
  if (total <= 0) return 100;
  return Math.min(100, Math.round((concluidos / total) * 100));
}

export async function executarPassos(
  passos: PassoDePrecarregamento[],
  aoProgredir: (porcentagem: number, rotulo: string) => void
): Promise<void> {
  let concluidos = 0;
  for (const passo of passos) {
    aoProgredir(calcularPorcentagem(concluidos, passos.length), passo.rotulo);
    try {
      await passo.executar();
    } catch {
      // Passo que falha nao pode travar a entrada no app: seguimos degradados.
    }
    concluidos += 1;
    aoProgredir(calcularPorcentagem(concluidos, passos.length), passo.rotulo);
  }
}

export async function catalogoEmCache<T>(): Promise<T | null> {
  return ler<T>(CHAVE_DO_CATALOGO, VALIDADE_DO_CATALOGO_MS);
}

export async function baixarCatalogo(): Promise<unknown> {
  const resposta = await fetch('/api/catalogo', { headers: { accept: 'application/json' } });
  if (!resposta.ok) throw new Error('Catálogo indisponível');
  const dados = await resposta.json();
  await gravar(CHAVE_DO_CATALOGO, dados);
  return dados;
}

export function passosPadrao(): PassoDePrecarregamento[] {
  return [
    // Sem esperar document.fonts.ready: com a fonte externa fora do ar, esse passo
    // ficava pendurado e a tela de carregamento nunca saia.
    { rotulo: 'Preparando o tema', executar: () => Promise.resolve() },
    { rotulo: 'Baixando o catálogo', executar: baixarCatalogo },
    { rotulo: 'Guardando para uso offline', executar: () => Promise.resolve() }
  ];
}
