# Sistema visual — Yōkira Animes

Tudo que é cor, tamanho ou espaço no projeto sai de `src/lib/estilos/tema.css`.
Se você precisou escrever um valor cru em algum CSS, provavelmente falta um token.

## Paleta

| Token                    | Valor                  | Onde aparece                                      |
| ------------------------ | ---------------------- | ------------------------------------------------- |
| `--cor-fundo`            | `#08080b`              | Fundo da página inteira                           |
| `--cor-fundo-elevado`    | `#111116`              | Painel do hero, diálogos, cartões do painel admin |
| `--cor-superficie`       | `#16161d`              | Cards, campos de formulário, chips neutros        |
| `--cor-superficie-hover` | `#1e1e27`              | Estado de hover das superfícies                   |
| `--cor-borda`            | `#26262f`              | Contorno de painéis e separadores                 |
| `--cor-marca`            | `#8b5cf6`              | Botão principal, aba ativa, badge "Novo episódio" |
| `--cor-marca-forte`      | `#7c3aed`              | Hover do botão principal                          |
| `--cor-marca-suave`      | `rgba(139,92,246,.16)` | Chip "Legendas Br", faixa de offline              |
| `--cor-texto`            | `#ffffff`              | Títulos e texto principal                         |
| `--cor-texto-secundario` | `#a1a1ac`              | Sinopse, meta, itens de navegação inativos        |
| `--cor-texto-terciario`  | `#6f6f7b`              | Duração de episódio, notas de rodapé              |
| `--cor-estrela`          | `#f5c518`              | Estrela da nota                                   |
| `--cor-coroa`            | `#f0b429`              | Coroa do "30 dias gratuito"                       |

## Escala tipográfica

A escala é **propositalmente pequena**. Tipografia inflada gera rolagem
desnecessária e foi o principal erro visual que esta reconstrução corrigiu.

| Token        | rem    | px  | Uso                                          |
| ------------ | ------ | --- | -------------------------------------------- |
| `--texto-11` | 0.6875 | 11  | Chips, meta dos cards, subtítulo da logo     |
| `--texto-12` | 0.75   | 12  | Rótulos da barra inferior, legendas          |
| `--texto-13` | 0.8125 | 13  | Título de card, navegação, botões            |
| `--texto-14` | 0.875  | 14  | Sinopse, corpo, nome de episódio             |
| `--texto-16` | 1      | 16  | Título de seção no mobile                    |
| `--texto-20` | 1.25   | 20  | Título de seção no desktop, título de página |
| `--texto-28` | 1.75   | 28  | Título do hero no mobile                     |
| `--texto-40` | 2.5    | 40  | Título do hero no desktop                    |

**Exceção documentada:** abaixo de 400 px o título do hero cai para `1.375rem`.
Com 28 px uma palavra longa em caixa alta (`CREPÚSCULO`) quebrava no meio.

## Ritmo, raios e sombras

Espaçamentos em múltiplos de 4: `--espaco-1` (4px) até `--espaco-10` (40px).
Raios: `--raio-chip` 6px · `--raio-card` 10px · `--raio-painel` 14px · `--raio-botao` 999px.
Sombra única `--sombra-card` e duas durações de transição (`160ms` e `280ms`),
ambas com a mesma curva `cubic-bezier(0.22, 1, 0.36, 1)`.

## Medidas de layout

| Token                     | Valor  | Por quê                                    |
| ------------------------- | ------ | ------------------------------------------ |
| `--alvo-toque`            | 44px   | Mínimo de área tocável exigido no mobile   |
| `--altura-barra-inferior` | 62px   | Altura da barra de 5 abas                  |
| `--largura-maxima`        | 1600px | Onde o conteúdo para de crescer no desktop |

## Como CSS e marcação convivem

Cada componente é um par (às vezes trio) de arquivos com o mesmo nome:

```
cabecalho.svelte   marcação
cabecalho.css      estilo, importado pelo <script> do componente
cabecalho.ts       lógica, quando existe
```

O CSS entra por `import './arquivo.css'` dentro do `<script>` — e **não** por um
bloco `<style>`. Consequência prática: as regras são globais, então **toda classe
leva o prefixo do componente** (`.cartao-`, `.hero-`, `.painel-`, `.marca-`).
Foi uma escolha consciente: o `<style>` do Svelte escopa automaticamente, mas
obriga o CSS a morar dentro do `.svelte`, o que o prompt proíbe.

`:global(...)` **não funciona** nestes arquivos — é sintaxe exclusiva do bloco
`<style>` do Svelte e o minificador rejeita. Em CSS global basta o seletor
descendente normal (`.cartao-nota svg`).

## Ícones

29 ícones em `src/lib/visual/icones/`, um arquivo por ícone. Regras fixas:
`viewBox="0 0 24 24"`, `stroke-width="1.75"`, terminais arredondados,
`stroke="currentColor"` para herdar a cor do contexto, `aria-hidden="true"`.

Sólidos (`fill="currentColor"`): `play`, `pausa`, `coroa`.
Com opção de preenchimento: `estrela`, `marcador-lista`, `polegar-cima`.
Todos os outros são de contorno.

Nenhuma biblioteca de ícones e nenhum emoji — há um teste ponta a ponta que
falha se aparecer qualquer caractere das faixas de emoji do Unicode.

## Pôsteres

O repositório não versiona arte de terceiros. `src/lib/visual/posters/gerar-poster.ts`
gera um SVG determinístico a partir do slug: mesma entrada, mesma imagem — o que
mantém o cache válido. O administrador substitui pelo arquivo real via painel.
