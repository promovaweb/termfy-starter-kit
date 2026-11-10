/**
 * Comando `credentials`: cofre cifrado em credentials.json.
 *
 * Subcomandos: `set`, `get`, `list`, `remove`, `status` e `clear`. O valor de
 * `set` nunca vem por argumento de linha de comando: em terminal interativo
 * é digitado sem eco; fora dele, chega pelo stdin. Isso evita vazamento no
 * histórico do shell e na lista de processos.
 */
import { manifesto } from "../../app/manifesto.ts";
import { CodigoSaida } from "../../app/saida.ts";
import { erro } from "../../app/erros.ts";
import { VARIAVEL_CHAVE_MESTRA, caminhos } from "../../config/caminhos.ts";
import {
  definirCredencial,
  limparCofre,
  listarCredenciais,
  mascarar,
  obterCredencial,
  removerCredencial,
  statusCofre,
  validarNome,
} from "../../config/credenciais.ts";
import { confirmar, lerSegredo } from "../entrada.ts";
import { blocos, cor, tabela } from "../formato.ts";
import type { Comando } from "../registro.ts";

const codigos = [CodigoSaida.CREDENCIAIS, CodigoSaida.PERMISSAO, CodigoSaida.INTERROMPIDO] as const;

const definir: Comando = {
  nome: "set",
  descricao: "Grava ou substitui uma credencial. O valor é lido sem eco ou pelo stdin.",
  argumentos: [
    {
      nome: "nome",
      descricao: "Identificador da credencial: minúsculas, números, ponto, hífen e sublinhado (ex.: openai.api_key).",
      obrigatorio: true,
    },
  ],
  opcoes: [
    {
      nome: "--stdin",
      descricao: "Força a leitura do valor pela primeira linha do stdin, mesmo em terminal interativo.",
    },
  ],
  codigosSaida: codigos,
  interativo: true,
  exemplos: [
    `${manifesto.bin} credentials set openai.api_key`,
    `printf '%s' "$TOKEN" | ${manifesto.bin} credentials set github.token --stdin`,
  ],
  executar: async (ctx) => {
    const nome = validarNome(ctx.args[0] as string);
    let valor: string;
    if (ctx.opcoes.stdin === true) {
      const { lerStdin } = await import("../entrada.ts");
      valor = ((await lerStdin()).split(/\r?\n/)[0] ?? "").trim();
      if (!valor) throw erro.uso("Nenhum valor recebido pelo stdin.");
    } else {
      valor = await lerSegredo(`Valor de ${nome}`);
    }
    definirCredencial(nome, valor);
    return {
      dados: { nome, arquivo: caminhos.credentials(), gravada: true },
      texto: () => `${cor.ok("✓")} credencial "${nome}" gravada em ${caminhos.credentials()}`,
    };
  },
};

const obter: Comando = {
  nome: "get",
  descricao: "Mostra uma credencial mascarada. Use --reveal para o valor completo.",
  argumentos: [{ nome: "nome", descricao: "Identificador da credencial.", obrigatorio: true }],
  opcoes: [{ nome: "--reveal", descricao: "Imprime o valor em claro. Em --json, o campo passa a ser `valor`." }],
  codigosSaida: codigos,
  exemplos: [`${manifesto.bin} credentials get openai.api_key`, `${manifesto.bin} credentials get openai.api_key --reveal`],
  executar: (ctx) => {
    const nome = validarNome(ctx.args[0] as string);
    const valor = obterCredencial(nome);
    const revelar = ctx.opcoes.reveal === true;
    return {
      dados: revelar ? { nome, valor } : { nome, mascarado: mascarar(valor), tamanho: valor.length },
      texto: () => (revelar ? valor : mascarar(valor)),
    };
  },
};

const listar: Comando = {
  nome: "list",
  aliases: ["ls"],
  descricao: "Lista os nomes gravados. Nunca exibe valores.",
  codigosSaida: codigos,
  exemplos: [`${manifesto.bin} credentials list --json`],
  executar: () => {
    const nomes = listarCredenciais();
    return {
      dados: { quantidade: nomes.length, nomes },
      texto: () => (nomes.length ? nomes.join("\n") : cor.sutil("nenhuma credencial gravada")),
    };
  },
};

const remover: Comando = {
  nome: "remove",
  aliases: ["rm"],
  descricao: "Remove uma credencial do cofre.",
  argumentos: [{ nome: "nome", descricao: "Identificador da credencial.", obrigatorio: true }],
  codigosSaida: codigos,
  exemplos: [`${manifesto.bin} credentials remove github.token`],
  executar: (ctx) => {
    const nome = validarNome(ctx.args[0] as string);
    const removida = removerCredencial(nome);
    return {
      dados: { nome, removida },
      texto: () => (removida ? `${cor.ok("✓")} "${nome}" removida` : `${cor.aviso("•")} "${nome}" não existia`),
    };
  },
};

const status: Comando = {
  nome: "status",
  descricao: "Mostra arquivo, origem da chave mestra e quantidade de credenciais.",
  exemplos: [`${manifesto.bin} credentials status`],
  executar: () => {
    const s = statusCofre();
    const origem: Record<typeof s.origemChave, string> = {
      env: `variável ${VARIAVEL_CHAVE_MESTRA}`,
      arquivo: caminhos.chaveMestra(),
      nenhuma: "nenhuma (será criada na primeira gravação)",
    };
    return {
      dados: { ...s, variavelChaveMestra: VARIAVEL_CHAVE_MESTRA, algoritmo: "aes-256-gcm" },
      texto: () =>
        blocos(
          tabela([
            ["Arquivo", `${s.arquivo}${s.existe ? "" : cor.sutil(" (não criado)")}`],
            ["Cifra", "AES-256-GCM"],
            ["Chave mestra", origem[s.origemChave]],
            ["Credenciais", String(s.quantidade)],
          ]),
          s.nomes.length ? s.nomes.map((n) => `  ${cor.sutil("•")} ${n}`).join("\n") : undefined,
        ),
    };
  },
};

const limpar: Comando = {
  nome: "clear",
  descricao: "Apaga credentials.json inteiro. Mantém master.key. Pede confirmação em terminal.",
  opcoes: [{ nome: "--yes", aliases: ["-y"], descricao: "Não pede confirmação." }],
  codigosSaida: codigos,
  interativo: true,
  exemplos: [`${manifesto.bin} credentials clear --yes`],
  executar: async (ctx) => {
    if (ctx.opcoes.yes !== true) {
      const ok = await confirmar(`Apagar ${caminhos.credentials()}?`, false);
      if (!ok) throw erro.interrompido("Operação cancelada.");
    }
    const apagado = limparCofre();
    return {
      dados: { arquivo: caminhos.credentials(), apagado },
      texto: () => (apagado ? `${cor.ok("✓")} cofre apagado` : cor.sutil("não havia cofre para apagar")),
    };
  },
};

export const comandoCredentials: Comando = {
  nome: "credentials",
  aliases: ["cred"],
  descricao: "Guarda segredos cifrados (AES-256-GCM) em ~/.<bin>/credentials.json.",
  descricaoLonga:
    `Os valores ficam cifrados com uma chave mestra de 32 bytes. A chave vem da variável\n` +
    `${VARIAVEL_CHAVE_MESTRA} (64 caracteres hex) ou do arquivo master.key, criado com permissão 0600\n` +
    `na primeira gravação. Comandos que acessam APIs leem o valor com obterCredencial(nome) e\n` +
    `encerram com código 4 quando a credencial não existe.`,
  subcomandos: [definir, obter, listar, remover, status, limpar],
  codigosSaida: codigos,
};
