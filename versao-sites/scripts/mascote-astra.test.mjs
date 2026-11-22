import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {textoMascoteAstra} from '../app/componentes/mascote-astra-conteudo.ts';

test('Astra oferece os mesmos atalhos em PT-BR, ingles e espanhol', () => {
 for (const idioma of ['pt','en','es']) {
  const texto = textoMascoteAstra(idioma);
  for (const campo of ['nome','titulo','descricao','abrir','fechar','saudacao','acervo','comunidade']) {
   assert.equal(typeof texto[campo], 'string');
   assert.ok(texto[campo].length > 2, campo);
  }
 }
 assert.equal(textoMascoteAstra('pt').nome, textoMascoteAstra('desconhecido').nome);
});

test('a arte original otimizada possui assinatura WebP e tamanho compacto', () => {
 const imagem = readFileSync(new URL('../public/arte/mascote-astra.webp',import.meta.url));
 assert.equal(imagem.subarray(0,4).toString(), 'RIFF');
 assert.equal(imagem.subarray(8,12).toString(), 'WEBP');
 assert.ok(imagem.length <= 64 * 1024);
});

test('o componente evita overlay sobre chat e respeita movimento reduzido', () => {
 const css = readFileSync(new URL('../app/componentes/mascote-astra.css',import.meta.url), 'utf8');
 const componente = readFileSync(new URL('../app/componentes/mascote-astra.tsx',import.meta.url), 'utf8');
 assert.match(css, /prefers-reduced-motion:reduce/);
 assert.match(css, /position:relative/);
 assert.doesNotMatch(css, /position:fixed/);
 assert.match(componente, /aria-expanded/);
 assert.match(componente, /navegar\('catalogo'\)/);
 assert.match(componente, /navegar\('comunidade'\)/);
});
