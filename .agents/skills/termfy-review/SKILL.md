---
name: termfy-review
description: Audita entregas Termfy contra o CLISPEC.md e as regras do starter kit e relata achados por gravidade sem editar arquivos.
---

# Revisar uma entrega

Use esta skill para auditar código, documentação e conclusão da checklist.
A saída é um relatório. Não implemente correções nem marque itens da spec.

## Leia antes

- `AGENTS.md`, `CLISPEC.md`, `docs/spec.md` e `docs/architecture.md`.
- O diff da entrega e os arquivos completos que ele altera, incluindo testes.
- `src/cli/registry.ts`, `src/app/exit-codes.ts`, `src/app/errors.ts`,
  `src/config/credentials.ts`, `src/mcp/server.ts` e `src/tui/theme.ts`.
- [checklist.md](references/checklist.md) para executar as verificações.
- [severity.md](references/severity.md) para ordenar e escrever os achados.

## Regras

1. Não edite arquivos, não gere OpenCLI, não faça build, commit ou instalação.
   Execute apenas consultas e verificações sem alteração do repositório.
   Testes podem criar fixtures temporárias isoladas; confira sua limpeza.
2. Compare o comportamento ao item da spec e ao contrato publicado. Não trate
   preferência pessoal de estilo como defeito.
3. Um item `[x]` precisa de teste verde que exercite a entrega no código atual.
   `status: done` exige todos os itens concluídos. Não presuma aprovação a
   partir de um resultado antigo ou de um teste sem assertions pertinentes.
4. Confira descriptions, exit codes, segredos, stdout do MCP, cores da TUI,
   documentação e idioma conforme `references/checklist.md`.
5. Buscas apontam candidatos. Leia o contexto e siga chamadas antes de relatar
   vazamento ou violação. Não copie um segredo encontrado para o relatório.
6. Não chame serviços externos para reproduzir falhas. Use testes locais e
   fixtures sintéticas. Não use a pasta real de configuração do usuário.
7. Se uma checagem não puder executar, registre a limitação e seu impacto.
   Não declare a entrega aprovada enquanto faltar confirmação essencial.

## Passos

1. Rode `git status --short`, leia o diff e fixe os arquivos e itens sob revisão.
2. Execute as consultas de `references/checklist.md`, registrando comandos,
   exit codes e testes relacionados a cada item concluído.
3. Confira o código alcançado por CLI, MCP e TUI, além das linhas alteradas.
   Inspecione cada candidato apontado pelas buscas.
4. Classifique os achados com `references/severity.md` e proponha a menor
   correção suficiente, sem executá-la.
5. Confira `git status --short` novamente. Se testes gerarem alterações,
   informe os caminhos; não reverta trabalho da pessoa nem limpe arquivos à força.

## Marcos

Escopo lido; spec e testes confrontados; verificações concluídas ou limitações
registradas; achados localizados e ordenados; repositório sem edições da revisão.

## Saída

Entregue uma lista ordenada de P0 a P3. Cada item contém gravidade,
`arquivo:linha`, comportamento observado, consequência e correção sugerida.
Depois liste verificações e resultados. Se não houver achados, diga isso e
cite o que foi conferido, sem prometer ausência de falhas fora do escopo.

## Compatibilidade

Starter kit 0.7.x. Referências verificadas em 0.7.0. Caminhos usados incluem
`src/cli/commands.ts`, `src/cli/registry.ts`, `src/app/exit-codes.ts`,
`src/app/errors.ts`, `src/config/credentials.ts`, `src/mcp/server.ts`,
`src/tui/theme.ts`, `tests/`, `docs/cli.md` e `docs/spec.md`.
