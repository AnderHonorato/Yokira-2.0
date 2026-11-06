# Perfil, vitrine e recompensas

Publicado na versão Sites 12: https://yokira-2-ander.honoratoann.chatgpt.site/?p=perfil
Origem: `18a4d6b41ff196a3635a27c7738b7cce51debb18`.

A personalização usa a identidade do Yokira e afeta somente o perfil. O fundo
global do site permanece exclusivo da administração.

## Experiência

O perfil próprio e o público usam a mesma vitrine: capa atrás do retrato,
moldura equipada, nome/@, faixa de nível, emblema original animado, progresso de
XP, biografia, privacidade, data de entrada e atividade autorizada.

No perfil próprio, Meu hall reúne três destaques ordenáveis, coleção completa,
progresso e filtros de obtenção/raridade. Personalizar vitrine oferece prévia
antes de salvar, com capas, molduras e auras, envio de imagens, dados e privacidade.
O perfil público mostra somente os destaques equipados quando sua exibição está
permitida, sem divulgar inventário, coleção ou histórico privados. O cartão do
chat reaproveita a capa e a moldura equipadas para visitantes autorizados.

O movimento usa partículas, luz, órbitas e profundidade nos pedestais, efeitos
no retrato e transições. Pausa fora da tela/aba e respeita movimento reduzido.
Não há cobrança nem assinatura associada a essa personalização.

## Opções e desbloqueios

| Tipo | Item | Disponibilidade |
| --- | --- | --- |
| Capa | Obsidiana | Inicial |
| Capa | Minha imagem | Banner próprio enviado pelo usuário |
| Capa | Sakura ao luar | Sua jornada começa |
| Capa | Metrópole neon | Sua voz na comunidade |
| Capa | Observatório astral | Nível 20 |
| Capa | Dragões do amanhecer | Presença lendária |
| Moldura | Essencial | Inicial |
| Moldura | Prisma | Uma coleção só sua |
| Moldura | Laço estelar | Primeiro vínculo |
| Moldura | Soberana | Nível 20 |
| Moldura | Eterna | Nível 50 |
| Aura | Brisa | Inicial |
| Aura | Órbitas | Primeiro desafio |
| Aura | Constelação | A casa é sua |
| Aura | Aurora lendária | Presença lendária |

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

Validação da entrega: 157 testes backend, TypeScript, lint sem erros, build e
snapshot/migração19 aprovados. Chromium: 58 casos passaram diretamente e um após
retry inicial do banner; cinco duplicados omitidos. Oito cenários novos de perfil
passaram. Capturas do público em 390/1440/3440px, próprio e editor inspecionadas.

https://github.com/AnderHonorato/Yokira-2.0/actions/runs/42292399005
