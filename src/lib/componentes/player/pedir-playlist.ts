// Arquivo: src/lib/componentes/player/pedir-playlist.ts
// Pede a URL assinada da playlist no momento do play. Fica separado do componente
// pra dar pra testar a leitura da mensagem de erro sem montar um <video>.

export interface PlaylistAssinada {
  playlist: string;
  expiraEm: number;
}

export async function pedirPlaylist(
  episodioId: string,
  buscar: typeof fetch = fetch
): Promise<PlaylistAssinada> {
  const resposta = await buscar(
    `/api/midia/playlist?episodioId=${encodeURIComponent(episodioId)}`,
    { headers: { accept: 'application/json' } }
  );

  if (!resposta.ok) {
    // O `error()` do SvelteKit devolve {message}. Mostrar a mensagem do servidor
    // e o que diferencia "entre na sua conta" de "ainda esta processando".
    const corpo = (await resposta.json().catch(() => null)) as { message?: string } | null;
    throw new Error(corpo?.message ?? 'Não foi possível carregar o vídeo.');
  }

  return (await resposta.json()) as PlaylistAssinada;
}
