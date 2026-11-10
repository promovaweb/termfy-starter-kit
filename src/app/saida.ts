/**
 * Códigos de saída do processo.
 *
 * O CLI, a TUI e o servidor MCP terminam sempre com um destes códigos. Zero
 * significa sucesso. Cada família de falha recebe um número fixo para que
 * scripts e agentes consigam reagir sem ler a mensagem. A tabela também é
 * publicada em `--help`, em `--skill`, na descrição OpenCLI e na resource
 * MCP `exit-codes`, sempre a partir desta fonte única.
 */

/** Enumeração dos códigos de saída. */
export const CodigoSaida = {
  /** Operação concluída. */
  SUCESSO: 0,
  /** Falha inesperada sem classificação específica. */
  ERRO_GENERICO: 1,
  /** Argumentos, opções ou subcomando inválidos. */
  USO_INVALIDO: 2,
  /** settings.json ausente, inválido ou chave desconhecida. */
  CONFIGURACAO: 3,
  /** credentials.json ilegível, chave mestra ausente ou credencial não encontrada. */
  CREDENCIAIS: 4,
  /** Falha de rede ou resposta de API fora do esperado. */
  REDE_OU_API: 5,
  /** Recurso solicitado não existe (arquivo, registro, tela, tool). */
  NAO_ENCONTRADO: 6,
  /** Permissão negada ao ler ou gravar no sistema de arquivos. */
  PERMISSAO: 7,
  /** A TUI exige um terminal interativo e stdin ou stdout não é TTY. */
  TERMINAL_INDISPONIVEL: 8,
  /** O servidor MCP falhou ao iniciar ou perdeu o transporte stdio. */
  MCP: 9,
  /** Entrada do usuário cancelada ou processo interrompido (Ctrl+C). */
  INTERROMPIDO: 130,
} as const;

export type CodigoSaida = (typeof CodigoSaida)[keyof typeof CodigoSaida];

/** Descrição de cada código, na ordem em que aparece na documentação. */
export const descricoesSaida: ReadonlyArray<{ codigo: CodigoSaida; nome: string; descricao: string }> =
  Object.freeze([
    { codigo: CodigoSaida.SUCESSO, nome: "SUCESSO", descricao: "Operação concluída." },
    { codigo: CodigoSaida.ERRO_GENERICO, nome: "ERRO_GENERICO", descricao: "Falha inesperada sem classificação específica." },
    { codigo: CodigoSaida.USO_INVALIDO, nome: "USO_INVALIDO", descricao: "Argumentos, opções ou subcomando inválidos." },
    { codigo: CodigoSaida.CONFIGURACAO, nome: "CONFIGURACAO", descricao: "settings.json ausente, inválido ou chave desconhecida." },
    { codigo: CodigoSaida.CREDENCIAIS, nome: "CREDENCIAIS", descricao: "credentials.json ilegível, chave mestra ausente ou credencial não encontrada." },
    { codigo: CodigoSaida.REDE_OU_API, nome: "REDE_OU_API", descricao: "Falha de rede ou resposta de API fora do esperado." },
    { codigo: CodigoSaida.NAO_ENCONTRADO, nome: "NAO_ENCONTRADO", descricao: "Recurso solicitado não existe." },
    { codigo: CodigoSaida.PERMISSAO, nome: "PERMISSAO", descricao: "Permissão negada no sistema de arquivos." },
    { codigo: CodigoSaida.TERMINAL_INDISPONIVEL, nome: "TERMINAL_INDISPONIVEL", descricao: "A TUI exige um terminal interativo (TTY)." },
    { codigo: CodigoSaida.MCP, nome: "MCP", descricao: "O servidor MCP falhou ao iniciar ou perdeu o transporte stdio." },
    { codigo: CodigoSaida.INTERROMPIDO, nome: "INTERROMPIDO", descricao: "Entrada cancelada ou processo interrompido." },
  ]);

/** Devolve o nome simbólico de um código. */
export function nomeDoCodigo(codigo: number): string {
  return descricoesSaida.find((item) => item.codigo === codigo)?.nome ?? "DESCONHECIDO";
}
