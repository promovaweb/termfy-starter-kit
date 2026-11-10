/**
 * Leitura e gravação de settings.json.
 *
 * O arquivo guarda preferências em texto claro. Chaves aninhadas usam
 * notação de ponto (`saida.formato`). O esquema abaixo lista as chaves que o
 * esqueleto reconhece; projetos derivados ampliam `ESQUEMA_SETTINGS` e
 * ganham validação, valor padrão e documentação automática no `--help` do
 * comando `config`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { caminhos, existe, garantirDiretorioBase } from "./caminhos.ts";
import { classificarErroFs, erro } from "../app/erros.ts";
import { CodigoSaida } from "../app/saida.ts";

/** Tipo aceito por uma chave de configuração. */
export type TipoSetting = "string" | "number" | "boolean" | "enum";

/** Descrição de uma chave conhecida. */
export interface DefinicaoSetting {
  chave: string;
  tipo: TipoSetting;
  padrao: string | number | boolean;
  descricao: string;
  /** Valores aceitos quando `tipo` é `enum`. */
  valores?: readonly string[];
}

/** Esquema das chaves reconhecidas pelo esqueleto. */
export const ESQUEMA_SETTINGS: readonly DefinicaoSetting[] = Object.freeze([
  {
    chave: "saida.formato",
    tipo: "enum",
    padrao: "texto",
    valores: ["texto", "json"],
    descricao: "Formato padrão da saída do CLI quando --json não é informado.",
  },
  {
    chave: "saida.cores",
    tipo: "boolean",
    padrao: true,
    descricao: "Usa cores ANSI na saída de texto. NO_COLOR=1 sempre desliga.",
  },
  {
    chave: "tui.abaInicial",
    tipo: "enum",
    padrao: "overview",
    valores: ["overview", "about"],
    descricao: "Aba aberta ao iniciar a TUI.",
  },
  {
    chave: "tui.tema",
    tipo: "enum",
    padrao: "noite",
    valores: ["noite", "dia"],
    descricao: "Paleta da TUI. `noite` é a paleta padrão do modern unix.",
  },
  {
    chave: "telemetria.ativa",
    tipo: "boolean",
    padrao: false,
    descricao: "Reservado para projetos derivados. O esqueleto não envia nada.",
  },
]);

export type Settings = Record<string, unknown>;

/** Devolve um objeto com todos os valores padrão, já aninhado. */
export function settingsPadrao(): Settings {
  const resultado: Settings = {};
  for (const def of ESQUEMA_SETTINGS) definirCaminho(resultado, def.chave, def.padrao);
  return resultado;
}

/** Lê settings.json. Arquivo ausente devolve os padrões. */
export function lerSettings(): Settings {
  const caminho = caminhos.settings();
  if (!existe(caminho)) return settingsPadrao();
  let bruto: string;
  try {
    bruto = readFileSync(caminho, "utf8");
  } catch (e) {
    throw classificarErroFs(e, CodigoSaida.CONFIGURACAO, `Falha ao ler ${caminho}`);
  }
  let dados: unknown;
  try {
    dados = JSON.parse(bruto);
  } catch {
    throw erro.configuracao(`${caminho} não contém JSON válido.`, { caminho });
  }
  if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
    throw erro.configuracao(`${caminho} precisa conter um objeto JSON.`, { caminho });
  }
  return mesclar(settingsPadrao(), dados as Settings);
}

/** Grava settings.json com indentação de dois espaços. */
export function gravarSettings(settings: Settings): string {
  garantirDiretorioBase();
  const caminho = caminhos.settings();
  try {
    writeFileSync(caminho, `${JSON.stringify(settings, null, 2)}\n`, { mode: 0o600 });
  } catch (e) {
    throw classificarErroFs(e, CodigoSaida.CONFIGURACAO, `Falha ao gravar ${caminho}`);
  }
  return caminho;
}

/** Lê um valor por notação de ponto. Devolve `undefined` quando não existe. */
export function obterCaminho(objeto: Settings, chave: string): unknown {
  return chave.split(".").reduce<unknown>((atual, parte) => {
    if (atual && typeof atual === "object") return (atual as Record<string, unknown>)[parte];
    return undefined;
  }, objeto);
}

/** Define um valor por notação de ponto, criando os níveis intermediários. */
export function definirCaminho(objeto: Settings, chave: string, valor: unknown): void {
  const partes = chave.split(".");
  let atual: Record<string, unknown> = objeto;
  for (const parte of partes.slice(0, -1)) {
    if (!atual[parte] || typeof atual[parte] !== "object") atual[parte] = {};
    atual = atual[parte] as Record<string, unknown>;
  }
  atual[partes[partes.length - 1] as string] = valor;
}

/** Remove um valor por notação de ponto. Devolve `true` quando algo saiu. */
export function removerCaminho(objeto: Settings, chave: string): boolean {
  const partes = chave.split(".");
  let atual: Record<string, unknown> = objeto;
  for (const parte of partes.slice(0, -1)) {
    const proximo = atual[parte];
    if (!proximo || typeof proximo !== "object") return false;
    atual = proximo as Record<string, unknown>;
  }
  const ultima = partes[partes.length - 1] as string;
  if (!(ultima in atual)) return false;
  delete atual[ultima];
  return true;
}

/** Localiza a definição de uma chave no esquema. */
export function definicaoDe(chave: string): DefinicaoSetting | undefined {
  return ESQUEMA_SETTINGS.find((def) => def.chave === chave);
}

/**
 * Converte o texto digitado no terminal para o tipo declarado no esquema.
 * Chaves fora do esquema são aceitas como string, para dar espaço a
 * extensões do projeto derivado, mas o `--help` as marca como livres.
 */
export function converterValor(chave: string, texto: string): unknown {
  const def = definicaoDe(chave);
  if (!def) return texto;
  switch (def.tipo) {
    case "boolean": {
      const baixo = texto.toLowerCase();
      if (["true", "1", "sim", "yes", "on"].includes(baixo)) return true;
      if (["false", "0", "nao", "não", "no", "off"].includes(baixo)) return false;
      throw erro.configuracao(`"${chave}" espera true ou false; recebeu "${texto}".`, { chave, valor: texto });
    }
    case "number": {
      const numero = Number(texto);
      if (!Number.isFinite(numero)) {
        throw erro.configuracao(`"${chave}" espera um número; recebeu "${texto}".`, { chave, valor: texto });
      }
      return numero;
    }
    case "enum": {
      if (!def.valores?.includes(texto)) {
        throw erro.configuracao(
          `"${chave}" aceita apenas: ${def.valores?.join(", ")}; recebeu "${texto}".`,
          { chave, valor: texto, aceitos: def.valores },
        );
      }
      return texto;
    }
    default:
      return texto;
  }
}

/** Achata um objeto aninhado em pares `chave.ponto = valor`. */
export function achatar(objeto: Settings, prefixo = ""): Array<[string, unknown]> {
  const pares: Array<[string, unknown]> = [];
  for (const [k, v] of Object.entries(objeto)) {
    const chave = prefixo ? `${prefixo}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) pares.push(...achatar(v as Settings, chave));
    else pares.push([chave, v]);
  }
  return pares.sort((a, b) => a[0].localeCompare(b[0]));
}

function mesclar(base: Settings, extra: Settings): Settings {
  const saida: Settings = { ...base };
  for (const [k, v] of Object.entries(extra)) {
    const atual = saida[k];
    if (v && typeof v === "object" && !Array.isArray(v) && atual && typeof atual === "object") {
      saida[k] = mesclar(atual as Settings, v as Settings);
    } else {
      saida[k] = v;
    }
  }
  return saida;
}
