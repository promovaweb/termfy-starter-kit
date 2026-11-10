# Arquitetura

```text
src/
  main.ts                 ponto de entrada: decide TUI, CLI ou ajuda
  app/
    manifesto.ts          identidade do binário (nome, versão, autor, links)
    saida.ts              tabela de códigos de saída
    erros.ts              ErroApp e atalhos erro.*
  cli/
    index.ts              executarCli(argv): parse, opções globais, envelope JSON
    registro.ts           tipos Comando, DefinicaoOpcao, Contexto, Resultado
    parser.ts             argv → comando, argumentos e opções
    ajuda.ts              renderização do --help a partir do registro
    opencli.ts            descrição OpenCLI a partir do registro
    formato.ts            cores, tabelas e seções da saída de texto
    entrada.ts            leitura de segredos e confirmações
    comandos.ts           raiz da árvore de comandos
    comandos/             um arquivo por comando
  config/
    caminhos.ts           ~/.<bin>/ e variáveis de ambiente
    settings.ts           settings.json e ESQUEMA_SETTINGS
    cripto.ts             AES-256-GCM e chave mestra
    credenciais.ts        cofre cifrado
  mcp/
    servidor.ts           McpServer, stdio e catálogo para `mcp --list`
    tools/                uma função de registro por grupo de tools
    resources/            resources e templates
    prompts.ts            prompts
  tui/
    index.ts              montagem: cabeçalho, abas, conteúdo, barra de status
    tema.ts               paletas noite e dia
    tela.ts               contrato Tela e ContextoTela
    componentes.ts        painel, tabelaChaveValor, lista, titulo, sutil
    telas/                uma aba por arquivo
  skill/
    index.ts              docs/ embutida + referência gerada do registro
docs/                     documentação do binário; entra no --skill e vira o ebook
.ebook/ e ebook/          pipeline e saída do guia do usuário em PDF e EPUB
template/                 stubs de comando, tela e tool
.agents/skills/           skills do framework Termfy, instaladas via npx skills
scripts/                  build, bootstrap do template e validações
tests/                    bun test
```

## Fluxo de execução

1. `main.ts` lê `argv`. Sem argumentos e com TTY, chama `executarCli(["tui"])`.
   Sem TTY, imprime a ajuda e sai com 2. Com argumentos, passa adiante.
2. `parser.ts` caminha pela árvore do registro, separa opções e argumentos e
   valida contra as definições. Falhas viram `ErroApp(2)`.
3. `index.ts` trata `--version`, `--opencli`, `--skill` e `--help`. Depois
   chama `executar(ctx)` do comando.
4. O comando devolve `{ dados, texto }`. `index.ts` imprime texto ou o
   envelope JSON e devolve o código.
5. `main.ts` encerra o processo com esse código.

`mcp` e `tui` são comandos como os demais; eles só não devolvem antes de o
transporte ou o renderer fechar.

## Regras de dependência

- `app/` não importa de nenhuma outra camada.
- `config/` importa só de `app/`.
- `cli/`, `mcp/` e `tui/` importam de `app/` e `config/`. `mcp/` e `tui/`
  podem reutilizar funções de `cli/comandos/*` que coletam dados (como
  `dadosAbout`), nunca o contrário.
- `skill/` importa de `cli/registro.ts` para gerar a referência.

## Build

`bun run build` compila `src/main.ts` em `dist/<bin>` para a plataforma atual
com `bun build --compile`. `bun run build:todos` gera linux-x64, linux-arm64,
darwin-x64, darwin-arm64 e windows-x64. O OpenTUI embute a biblioteca nativa
no executável; o `docs/` entra como texto; o `package.json` entra como JSON.
