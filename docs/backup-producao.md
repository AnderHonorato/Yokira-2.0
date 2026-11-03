# Backup consistente do banco de produção

O Yokira usa SQLite em um volume persistente. Copiar o arquivo `.sqlite` enquanto
o servidor escreve nele **não é um backup confiável**, especialmente com WAL.

## Criar snapshot

No contêiner em execução, com o volume `/data` montado:

```sh
BACKUP_DIRETORIO=/data/backups npm run banco:backup
```

O comando usa `sqlite3 .backup` (snapshot transacional), confere
`PRAGMA integrity_check`, grava o arquivo `.sqlite` com permissão 0600 e
um manifesto JSON com tamanho e SHA-256. Falhas removem o arquivo parcial.
O teste de Docker executa um snapshot real e verifica sua integridade.

**Segurança:** o backup contém contas e outros dados pessoais. Nunca publique
esses arquivos no GitHub, em uma pasta estática ou em armazenamento público.
Mantenha cópia externa criptografada, retenção definida, acesso restrito e
rotação de chaves. **Backup no mesmo volume não protege contra perda do volume.**

## Restaurar com segurança

Não há restauração automática: a operação deve ocorrer durante uma janela de
manutenção, após interromper o servidor e o trabalhador HLS. Faça uma cópia do
banco atual antes de qualquer substituição, confira o SHA-256 do manifesto e
a integridade do snapshot com `sqlite3 -readonly arquivo.sqlite
'PRAGMA integrity_check;'`. Restaure somente no volume autorizado, aplique
as migrações não destrutivas e valide a aplicação antes de reabrir o acesso.

**Importante:** este snapshot cobre o banco. Os originais de vídeo, segmentos
HLS, imagens e outras mídias precisam de backup separado, com retenção e
restauração testadas. Não remova arquivos originais com base apenas no backup
do banco.

## Próximos passos operacionais

Configurar backup externo criptografado, agendamento e teste periódico de
restauração em ambiente isolado. Nenhum destino externo foi provisionado
automaticamente.
