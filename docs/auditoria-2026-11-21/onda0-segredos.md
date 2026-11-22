# Onda 0 — Protecao de credenciais (21/11/2026)

Base inspecionada: `sol/identidade-login-temas-20261105`, commit `25afce8`.

## Evidencias verificadas
- O CI existente em `.github/workflows/verificacoes-sites.yml` ja executa auditoria de dependencias, typecheck, testes, lint e build.
- Em `versao-sites/lib/servidor/validacao-fontes-episodio.ts`, o trecho `url.password` e leitura de uma propriedade da API `URL` usada para **rejeitar** URLs com credenciais. Nao ha uma senha literal visivel nesse arquivo na revisao. A sinalizacao GitGuardian do commit anterior ainda requer conferencia da ocorrencia original e historico; **nao deve ser encerrada automaticamente**.
- O arquivo de validacao ja rejeita URLs com esquema inseguro, enderecos internos e credenciais, cobertas por `fontes-episodio.test.mjs`.

## Alteracoes desta onda
- CI separado com Gitleaks para branches de producao e integracao; fail-on-leak sem permitir segredo de producao.
- `.gitleaks.toml` usando regras padrao, sem allowlist ampla.
- `.pre-commit-config.yaml` permite rodar Gitleaks antes de criar commits (opt-in local).

## Acoes manuais fora do codigo
1. Conferir ocorrencia exata do GitGuardian e se houve segredo real. Se real: revogar, rotacionar e investigar exposicao antes de qualquer limpeza de historico.
2. Habilitar secret scanning/push protection nas configuracoes GitHub quando disponiveis.
3. Nao fazer force-push nem reescrever branches publicadas sem combinar janela de seguranca com todos os colaboradores.

Nao foi confirmada a execucao do Gitleaks remoto apenas pela existencia deste arquivo; verificar o job da PR.
