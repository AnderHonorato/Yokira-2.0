import type { Page } from '@playwright/test';
import { catalogo } from '../../versao-sites/lib/catalogo';

export const urlEnviada = '/api/midia/00000000-0000-4000-8000-000000000111';
export async function prepararUploadsAdmin(page: Page) {
  const gravacoes: Record<string, unknown>[] = [];
  const titulos = catalogo
    .filter((t) => t.tipo === 'Série')
    .slice(0, 2)
    .map((t) => ({ ...t, oculto: false }));
  await page.addInitScript(() => {
    type Evento = (() => void) | null;
    class EnvioTeste {
      timeout = 0;
      status = 0;
      responseText = '';
      abortado = false;
      upload = { onprogress: null as Evento };
      onload: Evento = null;
      onerror: Evento = null;
      onabort: Evento = null;
      ontimeout: Evento = null;
      carga: Evento = null;
      open() {}
      setRequestHeader() {}
      send() {
        this.carga = this.onload;
        estado.envios.push(this);
      }
      abort() {
        this.abortado = true;
        this.onabort?.();
      }
    }
    const estado = {
      envios: [] as EnvioTeste[],
      responder(indice: number, url: string) {
        const envio = this.envios[indice];
        envio.status = 200;
        envio.responseText = JSON.stringify({ url });
        envio.carga?.();
      },
      expirar(indice: number) {
        this.envios[indice].ontimeout?.();
      }
    };
    Object.assign(window, { enviosMidiaTeste: estado });
    window.XMLHttpRequest = EnvioTeste as unknown as typeof XMLHttpRequest;
  });
  await page.route('**/api/yokira**', async (rota) => {
    const pedido = rota.request();
    if (pedido.method() === 'POST') {
      const dados = pedido.postDataJSON() as Record<string, unknown>;
      gravacoes.push(dados);
      return rota.fulfill({ json: { ok: true, id: dados.id || dados.alvoId || 'salvo' } });
    }
    switch (new URL(pedido.url()).searchParams.get('acao')) {
      case 'estado':
        return rota.fulfill({
          json: {
            usuario: {
              id: 'admin-qa',
              nome: 'Admin QA',
              papel: 'administrador',
              suspenso: false,
              xp: 0
            },
            minhaLista: [],
            progresso: [],
            colecao: []
          }
        });
      case 'notificacoes':
        return rota.fulfill({ json: { notificacoes: [] } });
      case 'acervo-admin':
        return rota.fulfill({ json: { catalogo: titulos, editoriais: [] } });
      case 'moderacao':
        return rota.fulfill({
          json: {
            usuarios: [],
            publicacoes: [],
            respostas: [],
            denuncias: [],
            registros: [],
            catalogo: titulos
          }
        });
      case 'banners-admin':
        return rota.fulfill({
          json: {
            intervaloPadraoSegundos: 8,
            catalogo: titulos,
            banners: titulos.map((t, i) => ({
              id: `banner-${i}`,
              tituloId: t.id,
              imagem: t.capa,
              personagem: '',
              link: '',
              intervaloSegundos: null,
              ordem: i,
              ativo: true,
              atualizadoEm: 1
            }))
          }
        });
      case 'temporadas-admin':
        return rota.fulfill({
          json: {
            temporadas: [1, 2].map((i) => ({
              id: `temp-${i}`,
              tituloId: titulos[0].id,
              numero: i,
              ordem: i,
              nome: `Temporada ${i}`,
              arquivado: false
            })),
            episodios: [1, 2].map((i) => ({
              id: `ep-${i}`,
              tituloId: titulos[0].id,
              temporadaId: 'temp-1',
              numero: i,
              titulo: `Episódio QA ${i}`,
              sinopse: '',
              duracao: 24,
              poster: '',
              videoUrl: 'https://media.exemplo.com/video.mp4',
              publicado: true,
              estreiaEm: null,
              arquivado: false,
              fontes: [
                {
                  id: `fonte-${i}`,
                  nome: 'Principal',
                  tipo: 'direto',
                  url: 'https://media.exemplo.com/video.mp4',
                  ativo: true,
                  ordem: 1
                }
              ]
            }))
          }
        });
      default:
        return rota.continue();
    }
  });
  return { gravacoes, titulos };
}
export async function responderUpload(page: Page, indice = 0) {
  await page.evaluate(
    ({ indice, url }) => {
      (
        window as unknown as { enviosMidiaTeste: { responder(i: number, url: string): void } }
      ).enviosMidiaTeste.responder(indice, url);
    },
    { indice, url: urlEnviada }
  );
}
