// Arquivo: src/lib/servidor/armazenamento/endereco-privado.ts
// Decide se um IP e de rede interna. Existe porque baixar video "de um link" faz o
// SERVIDOR abrir a conexao: sem esta checagem, um link apontando pra 127.0.0.1 ou pra
// 169.254.169.254 usaria o servidor como ponte pra dentro da propria infraestrutura.
//
// Funcao pura de proposito: e a peca que precisa estar certa, e testar faixa de IP
// contra um servidor de verdade seria lento e incompleto.

/** Faixas IPv4 que nunca sao de internet publica, em [primeiro octeto, mascara]. */
const FAIXAS_IPV4: Array<[string, number]> = [
  ['0.0.0.0', 8], // "este host"
  ['10.0.0.0', 8], // privada
  ['100.64.0.0', 10], // CGNAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local; e onde mora o metadata de nuvem
  ['172.16.0.0', 12], // privada
  ['192.0.0.0', 24], // protocolos
  ['192.0.2.0', 24], // TEST-NET-1
  ['192.168.0.0', 16], // privada
  ['198.18.0.0', 15], // benchmark
  ['198.51.100.0', 24], // TEST-NET-2
  ['203.0.113.0', 24], // TEST-NET-3
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4] // reservada
];

function paraNumero(ipv4: string): number | null {
  const partes = ipv4.split('.');
  if (partes.length !== 4) return null;

  let total = 0;
  for (const parte of partes) {
    if (!/^\d{1,3}$/.test(parte)) return null;
    const octeto = Number(parte);
    if (octeto > 255) return null;
    total = total * 256 + octeto;
  }
  return total >>> 0;
}

function dentroDaFaixa(endereco: number, base: string, mascara: number): boolean {
  const inicio = paraNumero(base);
  if (inicio === null) return false;
  // Deslocar 32 e no-op em JS; mascara /0 pegaria tudo, mas nao existe na lista.
  const bits = mascara === 0 ? 0 : (0xffffffff << (32 - mascara)) >>> 0;
  return (endereco & bits) >>> 0 === (inicio & bits) >>> 0;
}

export function ipv4Privado(endereco: string): boolean {
  const numero = paraNumero(endereco);
  if (numero === null) return true; // o que nao da pra entender nao passa
  return FAIXAS_IPV4.some(([base, mascara]) => dentroDaFaixa(numero, base, mascara));
}

export function ipv6Privado(endereco: string): boolean {
  const limpo = endereco
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .split('%')[0];

  if (limpo === '::1' || limpo === '::') return true;

  // IPv4 embutido (::ffff:127.0.0.1) e o disfarce mais comum: vale a regra do IPv4.
  const embutido = limpo.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (embutido) return ipv4Privado(embutido[1]);

  const primeiro = limpo.split(':')[0];
  if (primeiro.startsWith('fe8') || primeiro.startsWith('fe9')) return true; // link-local
  if (primeiro.startsWith('fea') || primeiro.startsWith('feb')) return true;
  if (primeiro.startsWith('fc') || primeiro.startsWith('fd')) return true; // unique local
  if (primeiro.startsWith('ff')) return true; // multicast

  return false;
}

/** Porta de entrada: serve pras duas familias. */
export function enderecoPrivado(endereco: string): boolean {
  return endereco.includes(':') ? ipv6Privado(endereco) : ipv4Privado(endereco);
}
