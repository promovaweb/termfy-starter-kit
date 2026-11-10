/**
 * Tipos e registro declarativo dos comandos.
 *
 * Cada comando é um objeto `Comando` que descreve nome, argumentos, opções,
 * subcomandos, exemplos e códigos de saída, além da função `executar`. O
 * parser, o `--help`, a saída `--json`, a descrição OpenCLI (`--opencli`) e a
 * documentação embutida (`--skill`) leem este mesmo registro. Assim, uma
 * opção documentada aqui aparece em todos os lugares sem duplicação.
 *
 * Para adicionar um comando: crie `src/cli/comandos/<nome>.ts` exportando um
 * `Comando` e registre-o em `comandos.ts`. O stub em `template/comando/`
 * mostra o formato esperado.
 */
import type { CodigoSaida } from "../app/saida.ts";

/** Argumento posicional. */
export interface DefinicaoArgumento {
  /** Nome exibido entre `<>` ou `[]` no uso. */
  nome: string;
  descricao: string;
  /** Quando `true`, a ausência gera USO_INVALIDO. */
  obrigatorio?: boolean;
  /** Aceita vários valores; só pode ser o último argumento. */
  variadico?: boolean;
  /** Lista fechada de valores aceitos. */
  valores?: readonly string[];
}

/** Opção nomeada (`--flag` ou `--chave valor`). */
export interface DefinicaoOpcao {
  /** Nome longo com os dois hifens, por exemplo `--json`. */
  nome: string;
  /** Aliases curtos ou alternativos, por exemplo `-j`. */
  aliases?: readonly string[];
  descricao: string;
  /** Presente quando a opção recebe um valor. Ausente em flags booleanas. */
  argumento?: {
    nome: string;
    valores?: readonly string[];
    /** Para opções com valor opcional (`--skill [topico]`). */
    opcional?: boolean;
  };
  /** Opção disponível em todos os subcomandos (OpenCLI `recursive`). */
  recursiva?: boolean;
  /** Valor assumido quando a opção não é informada. */
  padrao?: string | boolean;
  /** Oculta do `--help`, mas aceita pelo parser. */
  oculta?: boolean;
}

/** Valores já interpretados das opções, indexados pelo nome longo sem hifens. */
export type Opcoes = Record<string, string | boolean | undefined>;

/** Contexto entregue a `executar`. */
export interface Contexto {
  /** Argumentos posicionais na ordem informada. */
  args: string[];
  /** Opções já resolvidas (nome longo sem `--`). */
  opcoes: Opcoes;
  /** `true` quando a saída deve ser JSON. */
  json: boolean;
  /** Cadeia de comandos até aqui, por exemplo `["config", "set"]`. */
  caminho: string[];
  /** Escreve na saída padrão sem quebrar a convenção texto/JSON. */
  stdout: (texto: string) => void;
  /** Escreve na saída de erro (avisos, progresso). */
  stderr: (texto: string) => void;
  /** Indica se stdin é um terminal interativo. */
  interativo: boolean;
}

/** Retorno padronizado de um comando. */
export interface Resultado {
  /** Estrutura devolvida em `--json` dentro de `dados`. */
  dados: unknown;
  /** Texto para humanos. Pode ser função para renderizar só quando preciso. */
  texto: string | (() => string);
  /** Código de saída. Ausente significa SUCESSO. */
  codigo?: CodigoSaida;
}

/** Definição completa de um comando ou subcomando. */
export interface Comando {
  nome: string;
  aliases?: readonly string[];
  /** Uma linha, usada nas listas. */
  descricao: string;
  /** Parágrafos extras exibidos no `--help` do próprio comando. */
  descricaoLonga?: string;
  argumentos?: readonly DefinicaoArgumento[];
  opcoes?: readonly DefinicaoOpcao[];
  subcomandos?: readonly Comando[];
  /** Linhas completas de exemplo, começando pelo nome do binário. */
  exemplos?: readonly string[];
  /** Códigos de saída que este comando pode devolver além de 0, 1 e 2. */
  codigosSaida?: readonly CodigoSaida[];
  /** Exige terminal interativo (OpenCLI `interactive`). */
  interativo?: boolean;
  /** Oculto do `--help` e da descrição OpenCLI pública. */
  oculto?: boolean;
  /** Ausente em comandos que só agrupam subcomandos. */
  executar?: (ctx: Contexto) => Promise<Resultado> | Resultado;
}

/** Opções globais, aceitas antes ou depois do subcomando. */
export const OPCOES_GLOBAIS: readonly DefinicaoOpcao[] = Object.freeze([
  {
    nome: "--help",
    aliases: ["-h"],
    descricao: "Mostra a ajuda do comando atual e encerra com código 0.",
    recursiva: true,
  },
  {
    nome: "--version",
    aliases: ["-V"],
    descricao: "Imprime a versão e encerra com código 0.",
    recursiva: true,
  },
  {
    nome: "--json",
    descricao:
      "Devolve a saída em JSON com o envelope { ok, comando, dados } ou { ok, comando, erro }. Erros também saem em JSON.",
    recursiva: true,
  },
  {
    nome: "--skill",
    argumento: { nome: "topico", opcional: true, valores: ["cli", "tui", "mcp", "config", "codigos"] },
    descricao:
      "Imprime a documentação completa embutida no binário, pensada para agentes de IA. Com um tópico, imprime só aquela seção.",
    recursiva: true,
  },
  {
    nome: "--opencli",
    descricao: "Imprime a descrição OpenCLI (JSON) de toda a árvore de comandos.",
    recursiva: true,
  },
  {
    nome: "--no-color",
    descricao: "Desliga cores ANSI na saída de texto. Equivale a NO_COLOR=1.",
    recursiva: true,
  },
]);

/** Localiza um subcomando por nome ou alias. */
export function encontrarSubcomando(pai: Comando, nome: string): Comando | undefined {
  return pai.subcomandos?.find((c) => c.nome === nome || c.aliases?.includes(nome));
}

/** Nome longo sem hifens, usado como chave em `Opcoes`. */
export function chaveDaOpcao(nome: string): string {
  return nome.replace(/^--?/, "");
}
