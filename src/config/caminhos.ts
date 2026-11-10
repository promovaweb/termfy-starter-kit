/**
 * Caminhos do diretório oculto do usuário.
 *
 * Tudo que o binário persiste fica em `~/.<bin>/`:
 *
 * - `settings.json`     preferências em texto claro;
 * - `credentials.json`  segredos cifrados com AES-256-GCM;
 * - `master.key`        chave mestra gerada na primeira gravação (modo 0600).
 *
 * A variável `<BIN>_HOME` troca a raiz, útil em testes e em ambientes de CI.
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync, statSync } from "node:fs";
import { manifesto } from "../app/manifesto.ts";
import { classificarErroFs } from "../app/erros.ts";
import { CodigoSaida } from "../app/saida.ts";

/** Nome da variável de ambiente que redireciona a pasta de dados. */
export const VARIAVEL_HOME = `${manifesto.prefixoEnv}_HOME`;

/** Nome da variável de ambiente que fornece a chave mestra em hex. */
export const VARIAVEL_CHAVE_MESTRA = `${manifesto.prefixoEnv}_MASTER_KEY`;

/** Raiz da pasta oculta, respeitando `<BIN>_HOME` quando definida. */
export function diretorioBase(): string {
  const alternativo = process.env[VARIAVEL_HOME];
  if (alternativo && alternativo.trim() !== "") return alternativo;
  return join(homedir(), `.${manifesto.bin}`);
}

export const caminhos = {
  base: diretorioBase,
  settings: () => join(diretorioBase(), "settings.json"),
  credentials: () => join(diretorioBase(), "credentials.json"),
  chaveMestra: () => join(diretorioBase(), "master.key"),
};

/**
 * Garante que a pasta base exista com permissão 0700.
 * Devolve o caminho criado ou já existente.
 */
export function garantirDiretorioBase(): string {
  const base = diretorioBase();
  try {
    mkdirSync(base, { recursive: true, mode: 0o700 });
    return base;
  } catch (e) {
    throw classificarErroFs(e, CodigoSaida.CONFIGURACAO, `Não foi possível criar ${base}`);
  }
}

/** Indica se um caminho existe sem lançar exceção. */
export function existe(caminho: string): boolean {
  try {
    statSync(caminho);
    return true;
  } catch {
    return false;
  }
}
