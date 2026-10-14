// Arquivo: src/lib/cliente/cache-sessao.ts
// Guardo aqui o catalogo baixado no primeiro acesso pra navegacao nao ir no servidor de novo.
// Depende de: idb-keyval? nao — uso IndexedDB direto pra nao inchar o bundle.

const NOME_DO_BANCO = 'yokira-cache';
const VERSAO_DO_ESQUEMA = 1;
const DEPOSITO = 'documentos';

export interface EntradaEmCache<T> {
  chave: string;
  valor: T;
  gravadoEm: number;
  versaoDoEsquema: number;
}

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolver, rejeitar) => {
    const pedido = indexedDB.open(NOME_DO_BANCO, VERSAO_DO_ESQUEMA);
    pedido.onupgradeneeded = () => {
      const banco = pedido.result;
      if (!banco.objectStoreNames.contains(DEPOSITO)) {
        banco.createObjectStore(DEPOSITO, { keyPath: 'chave' });
      }
    };
    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () => rejeitar(pedido.error);
  });
}

export async function gravar<T>(chave: string, valor: T): Promise<void> {
  const banco = await abrir();
  await new Promise<void>((resolver, rejeitar) => {
    const transacao = banco.transaction(DEPOSITO, 'readwrite');
    transacao.objectStore(DEPOSITO).put({
      chave,
      valor,
      gravadoEm: Date.now(),
      versaoDoEsquema: VERSAO_DO_ESQUEMA
    } satisfies EntradaEmCache<T>);
    transacao.oncomplete = () => resolver();
    transacao.onerror = () => rejeitar(transacao.error);
  });
  banco.close();
}

export async function ler<T>(chave: string, validadeMs: number): Promise<T | null> {
  const banco = await abrir();
  const entrada = await new Promise<EntradaEmCache<T> | undefined>((resolver, rejeitar) => {
    const pedido = banco.transaction(DEPOSITO, 'readonly').objectStore(DEPOSITO).get(chave);
    pedido.onsuccess = () => resolver(pedido.result as EntradaEmCache<T> | undefined);
    pedido.onerror = () => rejeitar(pedido.error);
  });
  banco.close();

  if (!entrada) return null;
  // Esquema antigo e tratado como cache vazio: melhor rebaixar do que servir formato errado.
  if (entrada.versaoDoEsquema !== VERSAO_DO_ESQUEMA) return null;
  if (Date.now() - entrada.gravadoEm > validadeMs) return null;
  return entrada.valor;
}

export async function limparTudo(): Promise<void> {
  const banco = await abrir();
  await new Promise<void>((resolver, rejeitar) => {
    const transacao = banco.transaction(DEPOSITO, 'readwrite');
    transacao.objectStore(DEPOSITO).clear();
    transacao.oncomplete = () => resolver();
    transacao.onerror = () => rejeitar(transacao.error);
  });
  banco.close();
}
