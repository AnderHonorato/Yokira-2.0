import { ErroApi, identificador, inteiro, texto } from './validacao';
export function camposBanner(payload: Record<string, unknown>, nomes: string[]) {
 const permitidos = new Set(['acao', 'motivo', ...nomes]);
 if (Object.keys(payload).some(chave => !permitidos.has(chave))) throw new ErroApi('Campo de banner não permitido.');
 return texto(payload.motivo, 'Motivo', 3, 500);
}
/** Somente recursos locais absolutos ou HTTPS, sem credenciais, controles ou protocolos ativos. */
export function urlBanner(valor: unknown, imagem = false, opcional = false): string {
 if (opcional && valor === '') return '';
 const caminho = texto(valor, imagem ? 'Imagem' : 'Link', 1, 1500);
 if (/[\s\\\u0000-\u001f\u007f]/.test(caminho) || /%0[ad]|%5c/i.test(caminho)) throw new ErroApi('Endereço inválido.');
 if (caminho.startsWith('/') && !caminho.startsWith('//')) {
  if (caminho.split(/[?#]/)[0].split('/').some(segmento => ['.', '..', '%2e', '%2e%2e'].includes(segmento.toLowerCase()))) throw new ErroApi('Endereço inválido.');
  if (!imagem || /^\/arte\/[a-zA-Z0-9/_-]+\.(webp|png|jpe?g|avif)$/i.test(caminho) || /^\/api\/midia\/[a-f0-9-]{36}$/i.test(caminho)) return caminho;
 } else {
  try { const url = new URL(caminho); if (url.protocol === 'https:' && !url.username && !url.password) return url.href; } catch { /* Rejeita URL incompleta. */ }
 }
 throw new ErroApi('Use uma URL HTTPS ou um caminho local permitido.');
}
export function validarBanner(payload: Record<string, unknown>) {
 const motivo = camposBanner(payload, ['id','tituloId','imagem','personagem','link','intervaloSegundos','ordem','ativo']);
 if (typeof payload.ativo !== 'boolean') throw new ErroApi('Estado do banner inválido.');
 return { id: payload.id == null ? null : identificador(payload.id), tituloId: identificador(payload.tituloId),
  imagem: urlBanner(payload.imagem, true), personagem: urlBanner(payload.personagem, true, true), link: urlBanner(payload.link, false, true),
  intervaloSegundos: payload.intervaloSegundos === null ? null : inteiro(payload.intervaloSegundos, 'Tempo de exibição', 3, 60),
  ordem: inteiro(payload.ordem, 'Ordem', 0, 999), ativo: payload.ativo, motivo };
}
