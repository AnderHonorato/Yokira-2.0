// Arquivo: testes/unitarios/endereco-privado.teste.ts
// A peca que impede o "baixar de um link" de virar uma ponte pra dentro da rede.
// Cada faixa aqui e um endereco que o servidor NAO pode ser convencido a buscar.

import { describe, expect, it } from 'vitest';
import {
  enderecoPrivado,
  ipv4Privado,
  ipv6Privado
} from '../../src/lib/servidor/armazenamento/endereco-privado';
import { nomeDoLink } from '../../src/lib/servidor/armazenamento/baixar-de-url';

describe('ipv4Privado', () => {
  it('barra as faixas internas', () => {
    for (const interno of [
      '127.0.0.1',
      '127.9.9.9',
      '10.0.0.5',
      '10.255.255.255',
      '172.16.0.1',
      '172.31.255.255',
      '192.168.0.1',
      '0.0.0.0',
      '100.64.0.1',
      '198.18.0.1',
      '224.0.0.1',
      '240.0.0.1'
    ]) {
      expect(ipv4Privado(interno), interno).toBe(true);
    }
  });

  it('barra o metadata de nuvem, que e o alvo classico', () => {
    expect(ipv4Privado('169.254.169.254')).toBe(true);
  });

  it('deixa passar endereco publico', () => {
    for (const publico of ['8.8.8.8', '1.1.1.1', '172.32.0.1', '172.15.255.255', '93.184.216.34']) {
      expect(ipv4Privado(publico), publico).toBe(false);
    }
  });

  it('o que nao da pra entender nao passa', () => {
    for (const estranho of ['', 'abc', '1.2.3', '1.2.3.4.5', '999.1.1.1', '1.2.3.-4']) {
      expect(ipv4Privado(estranho), estranho).toBe(true);
    }
  });
});

describe('ipv6Privado', () => {
  it('barra loopback, link-local, unique-local e multicast', () => {
    for (const interno of ['::1', '::', 'fe80::1', 'fd00::1', 'fc00::abcd', 'ff02::1']) {
      expect(ipv6Privado(interno), interno).toBe(true);
    }
  });

  it('barra IPv4 interno disfarcado de IPv6', () => {
    // O disfarce mais comum: ::ffff:127.0.0.1 chega no mesmo lugar que 127.0.0.1.
    expect(ipv6Privado('::ffff:127.0.0.1')).toBe(true);
    expect(ipv6Privado('::ffff:169.254.169.254')).toBe(true);
  });

  it('deixa passar IPv6 publico', () => {
    expect(ipv6Privado('2606:4700:4700::1111')).toBe(false);
    expect(ipv6Privado('2001:4860:4860::8888')).toBe(false);
  });

  it('ignora o escopo de zona e os colchetes da URL', () => {
    expect(ipv6Privado('[fe80::1%eth0]')).toBe(true);
  });
});

describe('enderecoPrivado', () => {
  it('escolhe a familia sozinho', () => {
    expect(enderecoPrivado('10.1.2.3')).toBe(true);
    expect(enderecoPrivado('2606:4700::1')).toBe(false);
  });
});

describe('nomeDoLink', () => {
  it('pega o ultimo pedaco do caminho, ja decodificado', () => {
    expect(nomeDoLink(new URL('https://ex.com/videos/ep%2001.mp4'))).toBe('ep 01.mp4');
    expect(nomeDoLink(new URL('https://ex.com/a/b/c.mkv?token=1'))).toBe('c.mkv');
    expect(nomeDoLink(new URL('https://ex.com/'))).toBe('');
  });
});
