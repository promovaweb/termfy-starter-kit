#!/usr/bin/env bun
/**
 * Ponto de entrada do binário.
 *
 * Regra de despacho:
 *
 * 1. sem argumentos e com terminal interativo → abre a TUI;
 * 2. sem argumentos e sem TTY → imprime a ajuda e encerra com código 2,
 *    para que pipes e agentes não fiquem presos esperando uma interface;
 * 3. com argumentos → CLI (inclui `mcp`, que vira servidor stdio).
 *
 * O processo sempre termina por `process.exit` com um código da tabela de
 * `app/saida.ts`.
 */
import { executarCli } from "./cli/index.ts";
import { CodigoSaida } from "./app/saida.ts";

const argv = process.argv.slice(2);

process.on("SIGINT", () => {
  process.exit(CodigoSaida.INTERROMPIDO);
});

const semArgumentos = argv.length === 0;
const interativo = Boolean(process.stdin.isTTY && process.stdout.isTTY);

const codigo = semArgumentos && interativo ? await executarCli(["tui"]) : await executarCli(semArgumentos ? ["--help"] : argv);

process.exit(semArgumentos && !interativo ? CodigoSaida.USO_INVALIDO : codigo);
