# Checklist do bootstrap

## Antes

- [ ] `bun --version` responde 1.3.14 ou superior.
- [ ] `git status --short` sem mudanças alheias ao trabalho.
- [ ] Nome do executável validado: `^[a-z][a-z0-9-]{1,39}$`.

## Depois do `bun run init`

- [ ] `package.json`: `name`, `bin`, `description`, bloco `termfy` e `repository` atualizados.
- [ ] `.env.example`: variáveis com o novo prefixo.
- [ ] `README.md`, `AGENTS.md`, `CHANGELOG.md` e `.github/workflows/*.yml` sem a palavra `termfy` fora de citações ao framework e ao starter kit.
- [ ] `bun run skills:check` confirma as cinco skills em `.agents/skills/` e no `skills-lock.json`.
- [ ] `bun run dev -- --version` imprime o nome do binário e a versão de `package.json`.
- [ ] `bun run dev -- about --json` traz `data.author`, `data.site` e `data.repository` preenchidos.
- [ ] `bun run dev -- config path` aponta para `~/.<bin>/`.
- [ ] `bun run ebook` gerou `ebook/<Title>-User-Guide-v<version>.pdf` com o título novo na capa e a versão de `ebook/VERSION`.

## O que o bootstrap não faz

- Não altera `src/` nem `docs/`: ambos leem o manifesto em tempo de execução.
- Não cria credenciais nem settings.
- Não faz commit. O primeiro commit é seu, com a mensagem `release: <bin> v<version>`, com a versão de `package.json`.

## Erros comuns

| Sintoma | Causa | Ação |
| --- | --- | --- |
| `--version` ainda mostra `termfy` | `package.json` não foi regravado | confira permissões e rode o bootstrap de novo |
| teste `cli.test.ts` falha em `--help` | comando removido do registro | registre de novo ou ajuste o teste |
| `opencli:check` falha | registro mudou | `bun run opencli` e commit do `docs/opencli.json` |
