/**
 * Comando `about`: dados do binário, versão, runtime e créditos.
 * É a versão em linha de comando da aba About da TUI.
 */
import { creditos, manifesto } from "../../app/manifesto.ts";
import { caminhos } from "../../config/caminhos.ts";
import { blocos, cor, secao, tabela } from "../formato.ts";
import type { Comando } from "../registro.ts";

/** Coleta os dados exibidos por `about`, pela TUI e pela tool MCP `about`. */
export function dadosAbout() {
  return {
    bin: manifesto.bin,
    titulo: manifesto.titulo,
    versao: manifesto.versao,
    descricao: manifesto.descricao,
    autor: manifesto.autor,
    site: manifesto.site,
    repositorio: manifesto.repositorio,
    licenca: manifesto.licenca,
    executavel: process.execPath,
    runtime: `Bun ${Bun.version}`,
    plataforma: `${process.platform}-${process.arch}`,
    pid: process.pid,
    diretorioDados: caminhos.base(),
    creditos: creditos.map((c) => ({ ...c })),
  };
}

export const comandoAbout: Comando = {
  nome: "about",
  aliases: ["sobre"],
  descricao: "Mostra versão, executável, runtime, plataforma e créditos.",
  exemplos: [`${manifesto.bin} about`, `${manifesto.bin} about --json`],
  executar: () => {
    const d = dadosAbout();
    return {
      dados: d,
      texto: () =>
        blocos(
          `${cor.destaque(d.titulo)} ${cor.sutil(`v${d.versao}`)}\n${d.descricao}`,
          blocos(
            secao("Binário"),
            tabela([
              ["Executável", d.executavel],
              ["Runtime", d.runtime],
              ["Plataforma", d.plataforma],
              ["PID", String(d.pid)],
              ["Dados", d.diretorioDados],
              ["Licença", d.licenca],
            ]),
          ),
          blocos(
            secao("Projeto"),
            tabela([
              ["Autor", d.autor || "-"],
              ["Site", d.site || "-"],
              ["Repositório", d.repositorio || "-"],
            ]),
          ),
          blocos(secao("Créditos"), tabela(d.creditos.map((c) => [c.nome, `${c.papel} ${cor.sutil(c.url)}`]))),
        ),
    };
  },
};
