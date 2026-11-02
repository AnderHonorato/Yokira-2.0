# Yokira 2.0 — entrega ChatGPT

## Organização
A branch `main-ChatGPT` mantém uma cópia independente do Yokira original. A pasta `versao-sites/` contém a aplicação adaptada ao ambiente Sites. A base SvelteKit/Prisma/HLS da raiz foi preservada para execução em servidor Node com armazenamento e FFmpeg.

O Sites usa Cloudflare Workers e D1. A aplicação hospedada usa o starter oficial Vinext e autenticação gerenciada pelo Sites; os dados pessoais ficam separados por identidade autenticada. Não é possível executar o processador FFmpeg/SQLite nativo da base nesse runtime. Processamento e upload de episódios permanecem na base Node e exigem sua infraestrutura de vídeo para produção.

## Versão hospedada
- Home editorial, catálogo com busca e filtros, detalhes de títulos, agenda, rankings e guias autorais.
- Lista pessoal, progresso, perfil, fórum, respostas, listas com votação única e jogos com limites de uso.
- Player próprio com controles, retomada e suporte a HLS quando uma mídia válida está configurada.
- Vídeo de demonstração separado do catálogo: Big Buck Bunny, Blender Foundation, CC BY 3.0. Nenhum episódio das obras do catálogo é distribuído.
- Idiomas português, inglês e espanhol; tema claro/escuro; layout para celular e desktop.

## Fontes e dados
A composição visual foi investigada a partir das páginas públicas de `https://superanimes.com.br/`. Não se acessou seu backend nem áreas privadas; a implementação e o banco são próprios. A identidade continua Yokira 2.0. Guias editoriais são textos autorais. Não foram copiados usuários, identificadores de publicidade, segredos ou arquivos de episódios da referência.

A agenda mostra anos de estreia e informa a ausência de datas semanais confirmadas. As notas são metadados de referência, não atividade gerada no Yokira. Atividade e ranking da comunidade são calculados com os registros desta instalação.

## Desenvolvimento
Veja o README em `versao-sites/` para instalar, gerar migrações e executar o Site. A raiz mantém os comandos de desenvolvimento originais; o novo postinstall sincroniza Svelte antes de gerar o Prisma. Nunca use o banco real do projeto original para testar esta cópia.

Os resultados efetivamente executados ficam em `versao-sites/docs/VALIDACAO.md`.

## Publicação

Sites: https://yokira-2-ander.honoratoann.chatgpt.site

Fonte Sites: `dfdbf14fc81cc781f092a746e36b112589b27fc3`. Publicação privada concluída em 2026-11-02.

## Atualização de acompanhamento e player — 02/11/2026

A coleção ganhou situações, episódios vistos, notas privadas, busca e ordenação. A migração preserva as listas anteriores. O player recebeu retomada tardia, atalhos, salvamento ao pausar e recuperação de falhas; o trecho licenciado de demonstração agora é servido localmente. Foram corrigidos navegação, contraste e legibilidade em celular, persistência das preferências e renderização de links diretos.

Validação: TypeScript, lint sem erros, 15 testes, build de produção, navegação e mídia em 320/375/768 px e desktop. Detalhes e limites em versao-sites/docs/VALIDACAO.md.
