/**
 * Cofre de credenciais em credentials.json.
 *
 * O arquivo guarda um `EnvelopeCifrado` cujo conteúdo decifrado é um objeto
 * `{ nome: valor }`. Nomes seguem `[a-z0-9_.-]`, em minúsculas, e
 * identificam a API ou serviço (`openai.api_key`, `github.token`).
 *
 * As funções abaixo nunca escrevem o valor em log nem em erro. O comando
 * `credentials get` mascara por padrão e só revela com `--reveal`. O servidor
 * MCP expõe apenas nomes e metadados.
 */
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { caminhos, existe, garantirDiretorioBase } from "./caminhos.ts";
import { cifrar, decifrar, ehEnvelope, obterChaveMestra, origemChaveMestra } from "./cripto.ts";
import { classificarErroFs, erro } from "../app/erros.ts";
import { CodigoSaida } from "../app/saida.ts";

export type Cofre = Record<string, string>;

const PADRAO_NOME = /^[a-z0-9][a-z0-9_.-]{0,63}$/;

/** Valida o nome de uma credencial e devolve o nome normalizado. */
export function validarNome(nome: string): string {
  const limpo = nome.trim().toLowerCase();
  if (!PADRAO_NOME.test(limpo)) {
    throw erro.uso(
      `Nome de credencial inválido: "${nome}". Use letras minúsculas, números, ponto, hífen ou sublinhado (até 64 caracteres).`,
      { nome },
    );
  }
  return limpo;
}

/** Lê e decifra o cofre. Arquivo ausente devolve cofre vazio. */
export function lerCofre(): Cofre {
  const caminho = caminhos.credentials();
  if (!existe(caminho)) return {};
  let bruto: string;
  try {
    bruto = readFileSync(caminho, "utf8");
  } catch (e) {
    throw classificarErroFs(e, CodigoSaida.CREDENCIAIS, `Falha ao ler ${caminho}`);
  }
  let envelope: unknown;
  try {
    envelope = JSON.parse(bruto);
  } catch {
    throw erro.credenciais(`${caminho} não contém JSON válido.`, { caminho });
  }
  if (!ehEnvelope(envelope)) {
    throw erro.credenciais(`${caminho} não está no formato cifrado esperado.`, { caminho });
  }
  const chave = obterChaveMestra(false);
  const texto = decifrar(envelope, chave);
  let cofre: unknown;
  try {
    cofre = JSON.parse(texto);
  } catch {
    throw erro.credenciais("O conteúdo decifrado de credentials.json não é JSON válido.");
  }
  if (!cofre || typeof cofre !== "object" || Array.isArray(cofre)) {
    throw erro.credenciais("O conteúdo decifrado de credentials.json precisa ser um objeto.");
  }
  return cofre as Cofre;
}

/** Cifra e grava o cofre inteiro, criando a chave mestra se preciso. */
export function gravarCofre(cofre: Cofre): string {
  garantirDiretorioBase();
  const chave = obterChaveMestra(true);
  const envelope = cifrar(JSON.stringify(cofre), chave);
  const caminho = caminhos.credentials();
  try {
    writeFileSync(caminho, `${JSON.stringify(envelope, null, 2)}\n`, { mode: 0o600 });
  } catch (e) {
    throw classificarErroFs(e, CodigoSaida.CREDENCIAIS, `Falha ao gravar ${caminho}`);
  }
  return caminho;
}

/** Define ou substitui uma credencial. */
export function definirCredencial(nome: string, valor: string): void {
  const chave = validarNome(nome);
  if (valor.length === 0) throw erro.uso("O valor da credencial não pode ser vazio.", { nome: chave });
  const cofre = existe(caminhos.credentials()) ? lerCofre() : {};
  cofre[chave] = valor;
  gravarCofre(cofre);
}

/**
 * Lê uma credencial. Ausência lança CREDENCIAIS, para que o chamador
 * (um comando que acessa uma API) encerre com o código certo.
 */
export function obterCredencial(nome: string): string {
  const chave = validarNome(nome);
  const cofre = lerCofre();
  const valor = cofre[chave];
  if (valor === undefined) {
    throw erro.credenciais(`Credencial "${chave}" não encontrada. Grave com: credentials set ${chave}`, {
      nome: chave,
    });
  }
  return valor;
}

/** Remove uma credencial. Devolve `false` quando ela não existia. */
export function removerCredencial(nome: string): boolean {
  const chave = validarNome(nome);
  const cofre = lerCofre();
  if (!(chave in cofre)) return false;
  delete cofre[chave];
  gravarCofre(cofre);
  return true;
}

/** Lista os nomes gravados, em ordem alfabética. */
export function listarCredenciais(): string[] {
  return Object.keys(lerCofre()).sort();
}

/** Apaga credentials.json por completo. Mantém master.key. */
export function limparCofre(): boolean {
  const caminho = caminhos.credentials();
  if (!existe(caminho)) return false;
  try {
    unlinkSync(caminho);
  } catch (e) {
    throw classificarErroFs(e, CodigoSaida.CREDENCIAIS, `Falha ao remover ${caminho}`);
  }
  return true;
}

/** Mascara um segredo para exibição: mantém 4 primeiros e 2 últimos caracteres. */
export function mascarar(valor: string): string {
  if (valor.length <= 8) return "*".repeat(valor.length);
  return `${valor.slice(0, 4)}${"*".repeat(Math.min(valor.length - 6, 12))}${valor.slice(-2)}`;
}

/** Estado resumido do cofre, sem valores, para `credentials status` e MCP. */
export function statusCofre(): {
  arquivo: string;
  existe: boolean;
  origemChave: ReturnType<typeof origemChaveMestra>;
  quantidade: number;
  nomes: string[];
} {
  const arquivo = caminhos.credentials();
  const ha = existe(arquivo);
  const origem = origemChaveMestra();
  let nomes: string[] = [];
  if (ha && origem !== "nenhuma") {
    try {
      nomes = listarCredenciais();
    } catch {
      nomes = [];
    }
  }
  return { arquivo, existe: ha, origemChave: origem, quantidade: nomes.length, nomes };
}
