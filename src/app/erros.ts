/**
 * Erro de domínio com código de saída.
 *
 * Qualquer falha prevista deve ser lançada como `ErroApp`, informando o
 * código da tabela em `saida.ts`. A camada de entrada (`main.ts`) converte o
 * erro em mensagem de texto ou JSON e encerra o processo com o código certo.
 * Erros sem essa classe caem em `ERRO_GENERICO`.
 */
import { CodigoSaida, nomeDoCodigo } from "./saida.ts";

export class ErroApp extends Error {
  readonly codigo: CodigoSaida;
  /** Dados extras seguros para exibir ao usuário ou devolver em --json. */
  readonly detalhes?: Record<string, unknown>;

  constructor(codigo: CodigoSaida, mensagem: string, detalhes?: Record<string, unknown>) {
    super(mensagem);
    this.name = "ErroApp";
    this.codigo = codigo;
    this.detalhes = detalhes;
  }

  /** Representação estável usada pela saída `--json`. */
  paraJson(): { codigo: number; nome: string; mensagem: string; detalhes?: Record<string, unknown> } {
    return {
      codigo: this.codigo,
      nome: nomeDoCodigo(this.codigo),
      mensagem: this.message,
      ...(this.detalhes ? { detalhes: this.detalhes } : {}),
    };
  }
}

/** Atalhos para os erros mais comuns. */
export const erro = {
  uso: (mensagem: string, detalhes?: Record<string, unknown>) =>
    new ErroApp(CodigoSaida.USO_INVALIDO, mensagem, detalhes),
  configuracao: (mensagem: string, detalhes?: Record<string, unknown>) =>
    new ErroApp(CodigoSaida.CONFIGURACAO, mensagem, detalhes),
  credenciais: (mensagem: string, detalhes?: Record<string, unknown>) =>
    new ErroApp(CodigoSaida.CREDENCIAIS, mensagem, detalhes),
  rede: (mensagem: string, detalhes?: Record<string, unknown>) =>
    new ErroApp(CodigoSaida.REDE_OU_API, mensagem, detalhes),
  naoEncontrado: (mensagem: string, detalhes?: Record<string, unknown>) =>
    new ErroApp(CodigoSaida.NAO_ENCONTRADO, mensagem, detalhes),
  permissao: (mensagem: string, detalhes?: Record<string, unknown>) =>
    new ErroApp(CodigoSaida.PERMISSAO, mensagem, detalhes),
  terminal: (mensagem: string) => new ErroApp(CodigoSaida.TERMINAL_INDISPONIVEL, mensagem),
  mcp: (mensagem: string, detalhes?: Record<string, unknown>) => new ErroApp(CodigoSaida.MCP, mensagem, detalhes),
  interrompido: (mensagem = "Operação interrompida.") => new ErroApp(CodigoSaida.INTERROMPIDO, mensagem),
};

/**
 * Converte um erro do Node/Bun de sistema de arquivos em `ErroApp`.
 * EACCES e EPERM viram PERMISSAO; ENOENT vira NAO_ENCONTRADO; o restante
 * recebe o código informado em `padrao`.
 */
export function classificarErroFs(e: unknown, padrao: CodigoSaida, contexto: string): ErroApp {
  if (e instanceof ErroApp) return e;
  const codigoFs = (e as { code?: string })?.code;
  const mensagem = e instanceof Error ? e.message : String(e);
  if (codigoFs === "EACCES" || codigoFs === "EPERM") {
    return new ErroApp(CodigoSaida.PERMISSAO, `${contexto}: permissão negada (${mensagem}).`);
  }
  if (codigoFs === "ENOENT") {
    return new ErroApp(CodigoSaida.NAO_ENCONTRADO, `${contexto}: caminho não encontrado (${mensagem}).`);
  }
  return new ErroApp(padrao, `${contexto}: ${mensagem}`);
}
