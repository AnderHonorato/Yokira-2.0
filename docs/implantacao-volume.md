# Yokira 2.0 — implantação com armazenamento persistente

Esta configuração prepara a aplicação **SvelteKit/Prisma/FFmpeg** da raiz.
Ela não é o frontend React/Vinext de `versao-sites/` e **não atualiza**
automaticamente o endereço `chatgpt.site` existente.

## Projeto e serviço

1. Use a branch `main-ChatGPT` do repositório `AnderHonorato/Yokira-2.0`.
2. Crie um **projeto novo** no Railway; não reaproveite projetos existentes sem inspeção.
3. Configure um serviço Node com o `Dockerfile` da raiz e somente **uma réplica**.
4. Anexe um **volume persistente** ao serviço, montado em `/data`. O contêiner
   corrige a propriedade do volume ao iniciar e passa a rodar como usuário `node`.
5. Gere um domínio HTTPS para a aplicação e configure as variáveis abaixo.

## Variáveis obrigatórias

Defina os valores no painel seguro do provedor, **nunca no GitHub**:

```dotenv
NODE_ENV=production
ORIGIN=https://seu-dominio-https.example
DATABASE_URL=file:/data/yokira.sqlite
PASTA_UPLOADS=/data/originais
PASTA_HLS=/data/hls
YOKIRA_VOLUME_PERSISTENTE=/data
CAMINHO_FFMPEG=ffmpeg
BODY_SIZE_LIMIT=8G
# Gere fora do repositório: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
SEGREDO_SESSAO=defina-na-plataforma-de-segredos
```

O Railway também informa `RAILWAY_VOLUME_MOUNT_PATH` quando o volume está
anexado; nesse caso `YOKIRA_VOLUME_PERSISTENTE` é opcional. Se houver
`RAILWAY_PUBLIC_DOMAIN`, o inicializador consegue preencher `ORIGIN`
automaticamente com HTTPS. Em domínio próprio, configure `ORIGIN` manualmente.

**Não configure `YOKIRA_MODO_TESTE_E2E=1`** e não use as contas demonstrativas.

## Inicialização e processamento

O `Dockerfile` instala o FFmpeg e compila a aplicação. A inicialização:

1. Valida segredo, origem HTTPS, banco e pastas de mídia dentro do volume.
2. Executa `prisma migrate deploy` sem resetar registros.
3. Inicia o servidor SvelteKit e o trabalhador FFmpeg em processos Node separados.
4. Reinicia o trabalhador se ele encerrar inesperadamente; se houver falhas
   repetidas, encerra o serviço para acionar a recuperação do provedor.

Com volume, reinícios não perdem originais, segmentos nem a fila no banco.
Um trabalho sem batimento por dez minutos volta a `NA_FILA`. No painel,
editores podem reenviar trabalhos com falha para nova tentativa.

**Não rode duas réplicas** desta configuração: SQLite e a pasta de mídia
estão no mesmo volume de um único serviço. Para escala horizontal, migrar
primeiro para banco multiusuário, armazenamento de objetos, fila distribuída
e workers dedicados.

## Primeiro administrador

Em produção, o seed não cria contas com senha pública. Crie sua própria conta
no site e use `npm run banco:promover -- email@dominio.com` em terminal
administrativo autenticado, dentro do serviço com acesso ao banco correto.
Revogue sessões demo antigas antes de disponibilizar uma base migrada.

## Endpoint de saúde

O serviço expõe `GET /api/saude`, que retorna HTTP 200 quando o Prisma
consegue consultar o banco e HTTP 503 quando a conexão falha. A resposta
contém somente o estado booleano, sem informações internas. O `railway.json`
usa essa rota para evitar considerar saudável uma instância sem banco.

## Verificações antes de anunciar a publicação

- Faça backup do volume e teste restauração antes de migrar uma base real.
- Confira os logs das migrations e do trabalhador até o primeiro job `CONCLUIDO`.
- Envie vídeo **licenciado** e verifique a playlist assinada, todas as
  variantes, legendas, retomada, progresso e a proteção de segmentos.
- Teste HTTPS, login, sessões, painel, celular, CORS/CSRF e limites de upload
  no proxy de borda. O teste automatizado não substitui prova em produção.
- A transcodificação e o armazenamento têm custo de CPU e disco. Avalie o
  orçamento do provedor antes de ativar o serviço.

## Limitações atuais

O player e o backend Node dispõem de HLS e URLs temporárias, mas não
implementam DRM. O navegador nunca impede 100% o download de mídia.
O site `versao-sites/` permanece uma implantação separada e não executa
este trabalhador FFmpeg por conta própria.
