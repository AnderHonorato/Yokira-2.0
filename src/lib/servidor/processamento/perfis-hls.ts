// Arquivo: src/lib/servidor/processamento/perfis-hls.ts
// Escadinha de qualidade. Tres degraus, nao seis: cada degrau a mais e uma transcodificacao
// inteira a mais por episodio, e 360/720/1080 ja cobre do 3G ao desktop.

export interface PerfilHls {
  altura: number;
  taxaBits: number;
  taxaAudio: number;
}

export const PERFIS: PerfilHls[] = [
  { altura: 360, taxaBits: 800_000, taxaAudio: 96_000 },
  { altura: 720, taxaBits: 2_500_000, taxaAudio: 128_000 },
  { altura: 1080, taxaBits: 5_000_000, taxaAudio: 192_000 }
];

/** Argumentos do ffmpeg pra gerar UMA variante. Separado pra dar pra testar sem rodar nada. */
export function argumentosDaVariante(
  entrada: string,
  saidaDaPasta: string,
  perfil: PerfilHls
): string[] {
  return [
    '-hide_banner',
    '-y',
    '-i',
    entrada,
    '-vf',
    `scale=-2:${perfil.altura}`,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-b:v',
    String(perfil.taxaBits),
    '-maxrate',
    String(Math.round(perfil.taxaBits * 1.07)),
    '-bufsize',
    String(perfil.taxaBits * 2),
    '-c:a',
    'aac',
    '-b:a',
    String(perfil.taxaAudio),
    '-hls_time',
    '6',
    '-hls_playlist_type',
    'vod',
    '-hls_segment_filename',
    `${saidaDaPasta}/${perfil.altura}p_%03d.ts`,
    `${saidaDaPasta}/${perfil.altura}p.m3u8`
  ];
}

/** Playlist mestre apontando pras variantes. O player escolhe sozinho pela banda. */
export function playlistMestre(perfis: PerfilHls[]): string {
  const linhas = ['#EXTM3U', '#EXT-X-VERSION:3'];
  for (const perfil of perfis) {
    const largura = Math.round((perfil.altura * 16) / 9);
    linhas.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${perfil.taxaBits},RESOLUTION=${largura}x${perfil.altura}`
    );
    linhas.push(`${perfil.altura}p.m3u8`);
  }
  return `${linhas.join('\n')}\n`;
}
