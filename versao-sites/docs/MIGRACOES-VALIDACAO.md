# Validação e recuperação das migrações Cloudflare D1

## O que o check realmente garante

`pnpm run test:migrations` cria um SQLite **descartável em memória** e executa todos os arquivos SQL `drizzle/0000_*.sql` até o último, na ordem. Verifica:
- início em `0000`, sequência contígua e nomes padronizados;
- execução do SQL e indicação do nome do arquivo com erro;
- presença de `usuarios`, `episodios` e `episodio_fontes`;
- `PRAGMA integrity_check` e `PRAGMA foreign_key_check`.

O comando **não acessa D1 de produção**, não testa contas reais e não altera Cloudflare. Ele complementa os testes de integração existentes e roda no workflow `verificacoes-sites.yml`.

## Desenvolvimento

```sh
cd versao-sites
pnpm install --frozen-lockfile
pnpm run test:migrations
pnpm test
pnpm run typecheck
pnpm run lint
pnpm run build
```

Para incluir uma nova migração, crie o próximo prefixo numérico e acrescente um teste de preservação dos dados legados. Não altere arquivos já aplicados em produção.

## Aplicação, backup e rollback de produção

1. Tire um backup/export do D1 e valide sua restauração em ambiente isolado **antes** de migrar. Faça backup dos objetos R2 que sofrerem transformações.
2. Execute migrações primeiro em ambiente de staging, depois em produção sob janela de manutenção.
3. Registre ID da migração, horário, revisão git e resultado de cada aplicação.
4. Ao encontrar falha, interrompa o deploy. Migrações D1 não devem ser revertidas automaticamente por SQL genérico.
5. Quando uma migração for aditiva, prefira uma nova migração corretiva. Para mudança destrutiva, restaure o backup validado em ambiente controlado e reconcilie escritas ocorridas depois do ponto de recuperação.

**Pendência**: o backup, restauração real, estratégia de compatibilidade de versões e observabilidade do D1 de produção precisam de procedimento operacional separado. Este verificador não os substitui.
