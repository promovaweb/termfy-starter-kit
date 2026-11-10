/**
 * Manifesto do binário.
 *
 * Reúne em um único lugar a identidade do executável: nome do comando,
 * título, versão, descrição, autor e links. Todo texto de ajuda, a aba About
 * da TUI, o servidor MCP e a descrição OpenCLI leem daqui. Ao usar este
 * repositório como template, `bun run iniciar -- --nome <bin>` reescreve o
 * bloco `termfy` e os campos `name`, `bin` e `description` do package.json.
 *
 * A leitura do package.json acontece em tempo de build: o Bun embute o JSON
 * no binário compilado, então o manifesto continua válido fora do repositório.
 */
import pacote from "../../package.json" with { type: "json" };

/** Identidade estática do executável. */
export interface Manifesto {
  /** Nome do executável, usado em `~/.<bin>/`, prefixo de env e URIs MCP. */
  readonly bin: string;
  /** Nome legível para títulos e cabeçalhos. */
  readonly titulo: string;
  /** Versão SemVer vinda do package.json. */
  readonly versao: string;
  /** Frase curta que descreve o que o binário faz. */
  readonly descricao: string;
  /** Pessoa ou organização responsável. */
  readonly autor: string;
  /** Site institucional. */
  readonly site: string;
  /** URL do repositório Git. */
  readonly repositorio: string;
  /** Licença declarada no package.json. */
  readonly licenca: string;
  /** Prefixo das variáveis de ambiente, derivado de `bin` em maiúsculas. */
  readonly prefixoEnv: string;
}

interface BlocoTermfy {
  bin?: string;
  titulo?: string;
  autor?: string;
  site?: string;
  repositorio?: string;
}

const bloco: BlocoTermfy = (pacote as { termfy?: BlocoTermfy }).termfy ?? {};
const bin = bloco.bin ?? pacote.name;

export const manifesto: Manifesto = Object.freeze({
  bin,
  titulo: bloco.titulo ?? bin,
  versao: pacote.version,
  descricao: pacote.description,
  autor: bloco.autor ?? "",
  site: bloco.site ?? "",
  repositorio: bloco.repositorio ?? "",
  licenca: pacote.license ?? "UNLICENSED",
  prefixoEnv: bin.replace(/[^a-z0-9]/gi, "_").toUpperCase(),
});

/** Créditos exibidos na aba About e no comando `about`. */
export const creditos: ReadonlyArray<{ nome: string; papel: string; url: string }> = Object.freeze([
  { nome: "Bun", papel: "runtime, bundler e compilador do binário", url: "https://bun.sh" },
  { nome: "OpenTUI", papel: "renderização da interface de terminal", url: "https://opentui.com" },
  { nome: "MCP TypeScript SDK", papel: "servidor Model Context Protocol via stdio", url: "https://modelcontextprotocol.io" },
  { nome: "OpenCLI", papel: "descrição padronizada da interface de linha de comando", url: "https://opencli.org" },
  { nome: "Zod", papel: "validação dos schemas das tools MCP", url: "https://zod.dev" },
]);
