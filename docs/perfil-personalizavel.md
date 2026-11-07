# Perfil, vitrine e recompensas

Publicado na versão Sites 14: https://yokira-2-ander.honoratoann.chatgpt.site/?p=perfil
Origem: `13c2478b73ebe63e1a459bfdc834a2287fe08e3c`.

A personalização usa a identidade do Yokira e afeta somente o perfil. O fundo
global do site permanece exclusivo da administração.

## Experiência

O perfil próprio e o público usam a mesma vitrine: capa atrás do retrato,
moldura equipada, nome/@, faixa de nível, emblema original animado, progresso de
XP, biografia, privacidade, data de entrada e atividade autorizada.

No perfil próprio, Meu hall reúne até três destaques ordenáveis em faixa e uma
coleção de linhas compactas, com progresso e filtros de obtenção/raridade.
Começa em Obtidas; Todas e A conquistar continuam disponíveis. Descrição e data
ficam em detalhes expansíveis, sem ocupar grandes cards.

Personalizar vitrine oferece prévia antes de salvar, com capas, molduras e auras
em opções horizontais compactas. Foto/capa própria e privacidade ficam em
seções recolhidas; nome/@ e biografia permanecem acessíveis diretamente.
Atalhos são links em uma linha, sem blocos preenchidos; abas usam sublinhado.
A capa mede 96px no celular, 120px no desktop e 144px no ultrawide; o retrato
mede 58/72px. Nível e XP ficam junto à identidade, sem painel separado.
O perfil público mostra somente os destaques equipados quando sua exibição está
permitida, sem divulgar inventário, coleção ou histórico privados. O cartão do
chat reaproveita a capa e a moldura equipadas para visitantes autorizados.

O movimento usa partículas, luz, órbitas, emblemas animados, efeitos no retrato
e transições. Os destaques ocupam uma faixa, sem pedestais ou cards grandes. Pausa fora da tela/aba e respeita movimento reduzido.
Não há cobrança nem assinatura associada a essa personalização.

## Opções e desbloqueios

| Tipo    | Item                 | Disponibilidade                     |
| ------- | -------------------- | ----------------------------------- |
| Capa    | Obsidiana            | Inicial                             |
| Capa    | Minha imagem         | Banner próprio enviado pelo usuário |
| Capa    | Sakura ao luar       | Sua jornada começa                  |
| Capa    | Metrópole neon       | Sua voz na comunidade               |
| Capa    | Observatório astral  | Nível 20                            |
| Capa    | Dragões do amanhecer | Presença lendária                   |
| Moldura | Essencial            | Inicial                             |
| Moldura | Prisma               | Uma coleção só sua                  |
| Moldura | Laço estelar         | Primeiro vínculo                    |
| Moldura | Soberana             | Nível 20                            |
| Moldura | Eterna               | Nível 50                            |
| Aura    | Brisa                | Inicial                             |
| Aura    | Órbitas              | Primeiro desafio                    |
| Aura    | Constelação          | A casa é sua                        |
| Aura    | Aurora lendária      | Presença lendária                   |

As capas ilustradas reutilizam as artes existentes. A imagem pessoal permanece
armazenada para voltar a usá-la após experimentar um preset, mas fica reservada
ao dono enquanto não estiver equipada. Remover a imagem volta à capa inicial.

## Persistência e segurança

`lib/personalizacao-perfil.ts` define os itens e o contrato `VisualPerfil`.
`perfis_sociais.visual` armazena apenas IDs de capa, moldura e aura; não aceita
CSS, HTML, URLs externas ou fatos de desbloqueio enviados pelo cliente.

O servidor usa XP e conquistas persistidas e revalida os requisitos dentro do
UPDATE. A leitura faz fallback seguro se a elegibilidade mudar. O inventário
completo acompanha somente a resposta própria. Respostas públicas preservam
privacidade/bloqueios e omitem imagens pessoais não equipadas.

A migração incremental `0019_personalizacao_perfil` conserva o banner antigo
como capa pessoal e mantém migrações aplicadas intactas. Clientes anteriores que
omitem `visual` preservam a personalização; troca/remoção de banner continua
compatível. Somente imagens próprias da finalidade correta podem ser equipadas.

Testes de servidor cobrem persistência, migração, IDs/formatos forjados, imagens
de outra conta, recompensas bloqueadas, suspensão/revogação concorrente e limite
D1. Testes Chromium cobrem perfil público 320–3440 px, prévia/salvamento/retry,
ordem do hall e movimento reduzido, com capturas para inspeção visual.

Validação atual: 157 testes backend, TypeScript, lint sem erros e build aprovados
no CI da revisão compacta. Dezesseis testes locais de perfil/movimento passaram
no Chromium, incluindo 320–3440px, prévia/save/retry/reload, ordem do hall,
seções recolhidas, marca original em movimento e pausa fora da tela.
Capturas de público, hall próprio e editor foram inspecionadas.

O primeiro teste detectou a faixa quebrando em duas linhas no tablet (194px);
o grid corrigiu a largura mantendo o limite de 155px nessa fixture. O teste de
visibilidade passou a rolar a seção estável, com espaço controlado na página de
teste, em vez de esperar um emblema animado ficar parado. A publicação não usa
esse espaço artificial. A versão 13 foi salva para revisão, sem publicação;
a versão 14 inclui os ajustes de tablet e atalhos.

Após publicar, HTTP 200 na home/chat/banners/marca, HTTP 401 nas operações
protegidas anônimas, imagem inexistente 404 e hash do PNG original preservado.
Fluxos próprios usam fixtures locais/CI; nenhuma identidade foi simulada em produção.

CI do backend da estrutura compacta:
https://github.com/AnderHonorato/Yokira-2.0/actions/runs/42338846795
