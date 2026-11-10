/**
 * Execução do CLI.
 *
 * `executarCli(argv)` analisa os argumentos, trata as opções globais
 * (`--help`, `--version`, `--skill`, `--opencli`), roda o comando e devolve
 * o código de saída. A impressão segue a convenção: texto para humanos,
 * `--json` para máquinas, com envelope estável em sucesso e em erro.
 */
import { ErroApp } from "../app/erros.ts";
import { manifesto } from "../app/manifesto.ts";
import { CodigoSaida, nomeDoCodigo } from "../app/saida.ts";
import { lerSettings, obterCaminho } from "../config/settings.ts";
import { textoDaSkill } from "../skill/index.ts";
import { renderizarAjuda } from "./ajuda.ts";
import { raiz } from "./comandos.ts";
import { cor, forcarCores } from "./formato.ts";
import { gerarOpenCli } from "./opencli.ts";
import { analisar } from "./parser.ts";
import type { Contexto, Resultado } from "./registro.ts";

const escrever = (texto: string) => {
  if (texto.length) process.stdout.write(texto.endsWith("\n") ? texto : `${texto}\n`);
};
const escreverErro = (texto: string) => {
  if (texto.length) process.stderr.write(texto.endsWith("\n") ? texto : `${texto}\n`);
};

function preferenciaJson(): boolean {
  try {
    return obterCaminho(lerSettings(), "saida.formato") === "json";
  } catch {
    return false;
  }
}

/** Imprime o envelope JSON de sucesso. */
export function imprimirJson(comando: string, dados: unknown): void {
  escrever(JSON.stringify({ ok: true, comando, dados }, null, 2));
}

/** Imprime o envelope JSON de erro. */
export function imprimirErroJson(comando: string, e: ErroApp): void {
  escrever(JSON.stringify({ ok: false, comando, erro: e.paraJson() }, null, 2));
}

/** Roda o CLI e devolve o código de saída, sem encerrar o processo. */
export async function executarCli(argv: readonly string[]): Promise<number> {
  let json = argv.includes("--json") || preferenciaJson();
  let nomeComando = manifesto.bin;

  try {
    const analise = analisar(raiz, argv);
    const { comando, caminho, args, opcoes } = analise;
    nomeComando = [manifesto.bin, ...caminho].join(" ");
    json = opcoes.json === true || (opcoes.json === undefined && preferenciaJson());
    if (opcoes["no-color"] === true) forcarCores(false);

    if (opcoes.version === true) {
      if (json) imprimirJson(nomeComando, { bin: manifesto.bin, versao: manifesto.versao });
      else escrever(`${manifesto.bin} ${manifesto.versao}`);
      return CodigoSaida.SUCESSO;
    }

    if (opcoes.opencli === true) {
      escrever(JSON.stringify(gerarOpenCli(raiz), null, 2));
      return CodigoSaida.SUCESSO;
    }

    if (opcoes.skill !== undefined) {
      const topico = typeof opcoes.skill === "string" ? opcoes.skill : undefined;
      const texto = textoDaSkill(raiz, topico);
      if (json) imprimirJson(nomeComando, { topico: topico ?? "todos", markdown: texto });
      else escrever(texto);
      return CodigoSaida.SUCESSO;
    }

    if (opcoes.help === true || !comando.executar) {
      const ajuda = renderizarAjuda(raiz, caminho, comando);
      if (json) imprimirJson(nomeComando, { ajuda: ajuda.replace(/\u001b\[[0-9;]*m/g, "") });
      else escrever(ajuda);
      return opcoes.help === true ? CodigoSaida.SUCESSO : CodigoSaida.USO_INVALIDO;
    }

    const ctx: Contexto = {
      args,
      opcoes,
      json,
      caminho,
      stdout: escrever,
      stderr: escreverErro,
      interativo: Boolean(process.stdin.isTTY && process.stdout.isTTY),
    };

    const resultado: Resultado = await comando.executar(ctx);
    if (json) imprimirJson(nomeComando, resultado.dados);
    else escrever(typeof resultado.texto === "function" ? resultado.texto() : resultado.texto);
    return resultado.codigo ?? CodigoSaida.SUCESSO;
  } catch (e) {
    const erroApp = e instanceof ErroApp ? e : new ErroApp(CodigoSaida.ERRO_GENERICO, e instanceof Error ? e.message : String(e));
    if (json) {
      imprimirErroJson(nomeComando, erroApp);
    } else {
      escreverErro(`${cor.erro("erro")} ${erroApp.message} ${cor.sutil(`[${erroApp.codigo} ${nomeDoCodigo(erroApp.codigo)}]`)}`);
      if (erroApp.codigo === CodigoSaida.USO_INVALIDO) escreverErro(cor.sutil(`Use "${nomeComando} --help".`));
    }
    return erroApp.codigo;
  }
}
