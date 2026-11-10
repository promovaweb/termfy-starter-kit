/**
 * Geração da descrição OpenCLI.
 *
 * Converte o registro de comandos no documento JSON definido pela OpenCLI
 * Specification 0.1 (https://opencli.org). Agentes e geradores de
 * documentação leem esse documento para saber como invocar o binário sem
 * abrir o código. O comando `bun run opencli` grava o resultado em
 * `docs/opencli.json`, e `bun run opencli:check` falha quando o arquivo está
 * desatualizado em relação ao registro.
 */
import { manifesto } from "../app/manifesto.ts";
import { descricoesSaida, CodigoSaida } from "../app/saida.ts";
import { OPCOES_GLOBAIS, type Comando, type DefinicaoArgumento, type DefinicaoOpcao } from "./registro.ts";

interface ArgumentoOpenCli {
  name: string;
  description?: string;
  required?: boolean;
  arity?: { minimum: number; maximum?: number };
  acceptedValues?: string[];
}

interface OpcaoOpenCli {
  name: string;
  aliases?: string[];
  description: string;
  required?: boolean;
  recursive?: boolean;
  arguments?: ArgumentoOpenCli[];
  metadata?: Array<{ name: string; value: unknown }>;
}

interface ComandoOpenCli {
  name: string;
  aliases?: string[];
  description?: string;
  arguments?: ArgumentoOpenCli[];
  options?: OpcaoOpenCli[];
  commands?: ComandoOpenCli[];
  exitCodes?: Array<{ code: number; description: string }>;
  examples?: string[];
  interactive?: boolean;
  hidden?: boolean;
}

export interface DocumentoOpenCli {
  $schema: string;
  opencli: "0.1";
  info: {
    title: string;
    version: string;
    summary: string;
    description: string;
    contact?: { name: string; url: string };
    license?: { name: string };
  };
  conventions: { groupOptions: boolean; optionSeparator: string };
  command: ComandoOpenCli;
}

function argumento(a: DefinicaoArgumento): ArgumentoOpenCli {
  const saida: ArgumentoOpenCli = { name: a.nome, description: a.descricao, required: a.obrigatorio === true };
  if (a.variadico) saida.arity = { minimum: a.obrigatorio ? 1 : 0 };
  if (a.valores) saida.acceptedValues = [...a.valores];
  return saida;
}

function opcao(o: DefinicaoOpcao): OpcaoOpenCli {
  const saida: OpcaoOpenCli = { name: o.nome, description: o.descricao };
  if (o.aliases?.length) saida.aliases = [...o.aliases];
  if (o.recursiva) saida.recursive = true;
  if (o.argumento) {
    saida.arguments = [
      {
        name: o.argumento.nome,
        required: !o.argumento.opcional,
        arity: { minimum: o.argumento.opcional ? 0 : 1, maximum: 1 },
        ...(o.argumento.valores ? { acceptedValues: [...o.argumento.valores] } : {}),
      },
    ];
  }
  if (o.padrao !== undefined) saida.metadata = [{ name: "x-default", value: o.padrao }];
  return saida;
}

function comando(c: Comando, ehRaiz: boolean): ComandoOpenCli {
  const saida: ComandoOpenCli = { name: ehRaiz ? manifesto.bin : c.nome, description: c.descricao };
  if (c.aliases?.length) saida.aliases = [...c.aliases];
  if (c.argumentos?.length) saida.arguments = c.argumentos.map(argumento);
  const opcoes = [...(ehRaiz ? OPCOES_GLOBAIS : []), ...(c.opcoes ?? [])].filter((o) => !o.oculta);
  if (opcoes.length) saida.options = opcoes.map(opcao);
  const filhos = (c.subcomandos ?? []).filter((s) => !s.oculto);
  if (filhos.length) saida.commands = filhos.map((s) => comando(s, false));
  if (c.exemplos?.length) saida.examples = [...c.exemplos];
  if (c.interativo) saida.interactive = true;
  if (c.oculto) saida.hidden = true;
  const base: readonly CodigoSaida[] = [CodigoSaida.SUCESSO, CodigoSaida.ERRO_GENERICO, CodigoSaida.USO_INVALIDO];
  const codigos = ehRaiz ? descricoesSaida : descricoesSaida.filter((d) => base.includes(d.codigo) || c.codigosSaida?.includes(d.codigo));
  saida.exitCodes = codigos.map((d) => ({ code: d.codigo, description: `${d.nome}: ${d.descricao}` }));
  return saida;
}

/** Monta o documento OpenCLI completo a partir da raiz do registro. */
export function gerarOpenCli(raiz: Comando): DocumentoOpenCli {
  return {
    $schema: "https://opencli.org/draft.json",
    opencli: "0.1",
    info: {
      title: manifesto.titulo,
      version: manifesto.versao,
      summary: manifesto.descricao,
      description:
        `${manifesto.descricao} Sem argumentos abre a TUI; "${manifesto.bin} mcp" inicia o servidor MCP via stdio; ` +
        `qualquer outro comando roda como CLI com saída em texto ou --json.`,
      ...(manifesto.autor ? { contact: { name: manifesto.autor, url: manifesto.site || manifesto.repositorio } } : {}),
      license: { name: manifesto.licenca },
    },
    conventions: { groupOptions: false, optionSeparator: " " },
    command: comando(raiz, true),
  };
}
