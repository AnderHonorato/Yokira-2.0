import type { Anime } from './catalogo';
export type BannerConfig = { id: string; tituloId: string; imagem: string; personagem: string; link: string; intervaloSegundos: number | null; ordem: number; ativo: boolean; atualizadoEm: number };
export type BannerDestaqueDTO = BannerConfig & { titulo: Anime; intervaloEfetivoSegundos: number };
export type BannersAdminDTO = { banners: BannerConfig[]; catalogo: (Anime & { oculto: boolean })[]; intervaloPadraoSegundos: number };
export const artesBanners = [
  { nome: 'One Piece · Luffy', tituloId: '2', arquivo: 'one-piece' },
  { nome: 'Naruto · Naruto Uzumaki', tituloId: '4', arquivo: 'naruto' },
  { nome: 'Bleach · Ichigo Kurosaki', tituloId: '1', arquivo: 'bleach' }
] as const;
export function previaBanner(imagem: string): string | undefined {
  return /^\/arte\/banners\/(one-piece|naruto|bleach)-cenario\.webp$/.test(imagem) ? imagem.replace('-cenario.webp', '-previa.webp') : undefined;
}
