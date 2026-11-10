/**
 * Comando `config`: lê e grava settings.json.
 *
 * Subcomandos: `list`, `get`, `set`, `unset`, `path` e `schema`. Chaves usam
 * notação de ponto. Valores são convertidos conforme `ESQUEMA_SETTINGS`.
 */
import { manifesto } from "../../app/manifesto.ts";
import { CodigoSaida } from "../../app/saida.ts";
import { erro } from "../../app/erros.ts";
import { caminhos, existe } from "../../config/caminhos.ts";
import {
  ESQUEMA_SETTINGS,
  achatar,
  converterValor,
  definicaoDe,
  definirCaminho,
  gravarSettings,
  lerSettings,
  obterCaminho,
  removerCaminho,
} from "../../config/settings.ts";
import { blocos, cor, secao, tabela } from "../formato.ts";
import type { Comando } from "../registro.ts";

const codigos = [CodigoSaida.CONFIGURACAO, CodigoSaida.PERMISSAO, CodigoSaida.NAO_ENCONTRADO] as const;

const listar: Comando = {
  nome: "list",
  aliases: ["ls"],
  descricao: "Lista todas as chaves com os valores em vigor (arquivo mesclado com os padrões).",
  codigosSaida: codigos,
  exemplos: [`${manifesto.bin} config list`, `${manifesto.bin} config list --json`],
  executar: () => {
    const settings = lerSettings();
    const pares = achatar(settings);
    return {
      dados: { arquivo: caminhos.settings(), existe: existe(caminhos.settings()), valores: Object.fromEntries(pares) },
      texto: () =>
        blocos(
          `${cor.sutil("Arquivo:")} ${caminhos.settings()}${existe(caminhos.settings()) ? "" : cor.sutil(" (ainda não criado; valores padrão)")}`,
          tabela(pares.map(([k, v]) => [k, JSON.stringify(v)])),
        ),
    };
  },
};

const obter: Comando = {
  nome: "get",
  descricao: "Mostra o valor de uma chave.",
  argumentos: [{ nome: "chave", descricao: "Chave em notação de ponto, por exemplo saida.formato.", obrigatorio: true }],
  codigosSaida: codigos,
  exemplos: [`${manifesto.bin} config get tui.abaInicial`],
  executar: (ctx) => {
    const chave = ctx.args[0] as string;
    const valor = obterCaminho(lerSettings(), chave);
    if (valor === undefined) {
      throw erro.configuracao(`Chave "${chave}" não existe. Veja "${manifesto.bin} config schema".`, { chave });
    }
    return { dados: { chave, valor }, texto: () => (typeof valor === "string" ? valor : JSON.stringify(valor)) };
  },
};

const definir: Comando = {
  nome: "set",
  descricao: "Grava um valor em settings.json, convertendo o tipo conforme o esquema.",
  argumentos: [
    { nome: "chave", descricao: "Chave em notação de ponto.", obrigatorio: true },
    { nome: "valor", descricao: "Valor em texto. Booleanos aceitam true/false, sim/nao, 1/0.", obrigatorio: true },
  ],
  codigosSaida: codigos,
  exemplos: [`${manifesto.bin} config set saida.formato json`, `${manifesto.bin} config set saida.cores false`],
  executar: (ctx) => {
    const [chave, texto] = ctx.args as [string, string];
    const valor = converterValor(chave, texto);
    const settings = lerSettings();
    definirCaminho(settings, chave, valor);
    const arquivo = gravarSettings(settings);
    const livre = definicaoDe(chave) === undefined;
    return {
      dados: { chave, valor, arquivo, chaveLivre: livre },
      texto: () =>
        `${cor.ok("✓")} ${chave} = ${JSON.stringify(valor)}${livre ? cor.sutil(" (chave fora do esquema, gravada como texto)") : ""}`,
    };
  },
};

const remover: Comando = {
  nome: "unset",
  aliases: ["rm"],
  descricao: "Remove uma chave do arquivo. A chave volta ao valor padrão, se houver.",
  argumentos: [{ nome: "chave", descricao: "Chave em notação de ponto.", obrigatorio: true }],
  codigosSaida: codigos,
  exemplos: [`${manifesto.bin} config unset telemetria.ativa`],
  executar: (ctx) => {
    const chave = ctx.args[0] as string;
    const settings = existe(caminhos.settings()) ? lerSettings() : {};
    const removido = removerCaminho(settings, chave);
    if (removido) gravarSettings(settings);
    return {
      dados: { chave, removido },
      texto: () => (removido ? `${cor.ok("✓")} ${chave} removida` : `${cor.aviso("•")} ${chave} não estava gravada`),
    };
  },
};

const caminho: Comando = {
  nome: "path",
  descricao: "Imprime o caminho da pasta de dados e dos arquivos.",
  exemplos: [`${manifesto.bin} config path`],
  executar: () => {
    const d = { base: caminhos.base(), settings: caminhos.settings(), credentials: caminhos.credentials(), chaveMestra: caminhos.chaveMestra() };
    return {
      dados: d,
      texto: () =>
        tabela([
          ["Pasta", d.base],
          ["settings.json", d.settings],
          ["credentials.json", d.credentials],
          ["master.key", d.chaveMestra],
        ]),
    };
  },
};

const esquema: Comando = {
  nome: "schema",
  descricao: "Lista as chaves reconhecidas, com tipo, padrão e descrição.",
  exemplos: [`${manifesto.bin} config schema --json`],
  executar: () => ({
    dados: { chaves: ESQUEMA_SETTINGS.map((d) => ({ ...d })) },
    texto: () =>
      blocos(
        secao("Chaves reconhecidas"),
        tabela(
          ESQUEMA_SETTINGS.map((d) => [
            d.chave,
            `${d.descricao} ${cor.sutil(`[${d.tipo}${d.valores ? `: ${d.valores.join("|")}` : ""}; padrão ${JSON.stringify(d.padrao)}]`)}`,
          ]),
        ),
      ),
  }),
};

export const comandoConfig: Comando = {
  nome: "config",
  descricao: "Lê e grava preferências em ~/.<bin>/settings.json.",
  descricaoLonga:
    `As preferências ficam em texto claro em ${caminhos.settings()}. Chaves aninhadas usam\n` +
    `notação de ponto. Chaves fora do esquema são aceitas como texto para dar espaço a\n` +
    `extensões do projeto. Segredos nunca entram aqui: use "${manifesto.bin} credentials".`,
  subcomandos: [listar, obter, definir, remover, caminho, esquema],
  codigosSaida: codigos,
};
