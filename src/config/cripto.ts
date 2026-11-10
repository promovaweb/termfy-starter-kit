/**
 * Cifra e decifra o conteúdo de credentials.json.
 *
 * Algoritmo: AES-256-GCM com IV aleatório de 12 bytes e tag de 16 bytes.
 * A chave mestra tem 32 bytes e vem, nesta ordem:
 *
 * 1. da variável `<BIN>_MASTER_KEY` (64 caracteres hex);
 * 2. do arquivo `~/.<bin>/master.key`, criado na primeira gravação com
 *    permissão 0600.
 *
 * Limite honesto: a cifra protege o arquivo contra leitura casual, backup
 * copiado para outro lugar e inspeção por ferramentas que varrem o disco.
 * Quem tem acesso à mesma conta do sistema consegue ler `master.key` e, por
 * consequência, decifrar o arquivo. Para um nível acima, injete a chave por
 * variável de ambiente a partir de um gerenciador de segredos.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, chmodSync } from "node:fs";
import { caminhos, existe, garantirDiretorioBase, VARIAVEL_CHAVE_MESTRA } from "./caminhos.ts";
import { ErroApp, classificarErroFs, erro } from "../app/erros.ts";
import { CodigoSaida } from "../app/saida.ts";

/** Formato gravado em disco. Todos os campos binários vão em base64. */
export interface EnvelopeCifrado {
  versao: 1;
  algoritmo: "aes-256-gcm";
  iv: string;
  tag: string;
  dados: string;
}

const ALGORITMO = "aes-256-gcm";
const TAMANHO_CHAVE = 32;
const TAMANHO_IV = 12;

/** Origem da chave mestra em uso, para o comando `credentials status`. */
export type OrigemChave = "env" | "arquivo" | "nenhuma";

/** Informa de onde a chave mestra viria sem criar nada. */
export function origemChaveMestra(): OrigemChave {
  if (process.env[VARIAVEL_CHAVE_MESTRA]) return "env";
  if (existe(caminhos.chaveMestra())) return "arquivo";
  return "nenhuma";
}

function chaveDaEnv(): Buffer | null {
  const valor = process.env[VARIAVEL_CHAVE_MESTRA];
  if (!valor) return null;
  const limpo = valor.trim();
  if (!/^[0-9a-fA-F]{64}$/.test(limpo)) {
    throw erro.credenciais(
      `${VARIAVEL_CHAVE_MESTRA} precisa ter 64 caracteres hexadecimais (32 bytes). Gere com: openssl rand -hex 32`,
    );
  }
  return Buffer.from(limpo, "hex");
}

/**
 * Lê a chave mestra. Com `criarSeFaltar`, gera `master.key` quando não há
 * variável de ambiente nem arquivo. Sem essa opção, lança CREDENCIAIS.
 */
export function obterChaveMestra(criarSeFaltar: boolean): Buffer {
  const daEnv = chaveDaEnv();
  if (daEnv) return daEnv;

  const caminho = caminhos.chaveMestra();
  if (existe(caminho)) {
    try {
      const conteudo = readFileSync(caminho, "utf8").trim();
      if (!/^[0-9a-fA-F]{64}$/.test(conteudo)) {
        throw erro.credenciais(`${caminho} está corrompido: esperado 64 caracteres hexadecimais.`);
      }
      return Buffer.from(conteudo, "hex");
    } catch (e) {
      throw classificarErroFs(e, CodigoSaida.CREDENCIAIS, `Falha ao ler ${caminho}`);
    }
  }

  if (!criarSeFaltar) {
    throw erro.credenciais(
      `Nenhuma chave mestra encontrada. Defina ${VARIAVEL_CHAVE_MESTRA} ou grave uma credencial para gerar ${caminho}.`,
    );
  }

  garantirDiretorioBase();
  const nova = randomBytes(TAMANHO_CHAVE);
  try {
    writeFileSync(caminho, `${nova.toString("hex")}\n`, { mode: 0o600 });
    chmodSync(caminho, 0o600);
  } catch (e) {
    throw classificarErroFs(e, CodigoSaida.CREDENCIAIS, `Falha ao gravar ${caminho}`);
  }
  return nova;
}

/** Cifra um texto e devolve o envelope pronto para serializar. */
export function cifrar(texto: string, chave: Buffer): EnvelopeCifrado {
  const iv = randomBytes(TAMANHO_IV);
  const cipher = createCipheriv(ALGORITMO, chave, iv);
  const dados = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    versao: 1,
    algoritmo: ALGORITMO,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    dados: dados.toString("base64"),
  };
}

/** Decifra um envelope. Tag inválida ou chave errada lançam CREDENCIAIS. */
export function decifrar(envelope: EnvelopeCifrado, chave: Buffer): string {
  if (envelope.versao !== 1 || envelope.algoritmo !== ALGORITMO) {
    throw erro.credenciais(`Formato de credentials.json não reconhecido (versão ${String(envelope.versao)}).`);
  }
  try {
    const decipher = createDecipheriv(ALGORITMO, chave, Buffer.from(envelope.iv, "base64"));
    decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
    const texto = Buffer.concat([
      decipher.update(Buffer.from(envelope.dados, "base64")),
      decipher.final(),
    ]);
    return texto.toString("utf8");
  } catch (e) {
    if (e instanceof ErroApp) throw e;
    throw erro.credenciais(
      "Não foi possível decifrar credentials.json. A chave mestra mudou ou o arquivo foi alterado.",
    );
  }
}

/** Confere se um objeto lido do disco tem a forma de `EnvelopeCifrado`. */
export function ehEnvelope(valor: unknown): valor is EnvelopeCifrado {
  if (!valor || typeof valor !== "object") return false;
  const v = valor as Record<string, unknown>;
  return (
    v.versao === 1 &&
    v.algoritmo === ALGORITMO &&
    typeof v.iv === "string" &&
    typeof v.tag === "string" &&
    typeof v.dados === "string"
  );
}
