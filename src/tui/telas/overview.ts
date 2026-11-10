/**
 * Aba Overview: estado do ambiente em um olhar.
 *
 * Mostra runtime, pasta de dados, estado de settings.json e do cofre, e as
 * primeiras ações sugeridas. É a aba inicial padrão e o lugar natural para
 * projetos derivados exibirem indicadores do próprio domínio.
 */
import { BoxRenderable } from "@opentui/core";
import { manifesto } from "../../app/manifesto.ts";
import { caminhos, existe } from "../../config/caminhos.ts";
import { statusCofre } from "../../config/credenciais.ts";
import { achatar, lerSettings } from "../../config/settings.ts";
import { espaco, lista, painel, sutil, tabelaChaveValor, titulo } from "../componentes.ts";
import { glifos } from "../tema.ts";
import type { Tela } from "../tela.ts";

export const telaOverview: Tela = {
  id: "overview",
  titulo: "Overview",
  descricao: "Ambiente, configuração e cofre em um olhar",
  montar: ({ renderer, tema }) => {
    const raiz = new BoxRenderable(renderer, { flexDirection: "column", flexGrow: 1 });

    const linhaSuperior = new BoxRenderable(renderer, { flexDirection: "row", flexShrink: 0 });

    const ambiente = painel(renderer, tema, { titulo: "Ambiente", flexGrow: 1, destaque: true });
    ambiente.add(
      tabelaChaveValor(renderer, tema, [
        ["Binário", `${manifesto.bin} v${manifesto.versao}`, tema.textoForte],
        ["Runtime", `Bun ${Bun.version}`],
        ["Plataforma", `${process.platform}-${process.arch}`],
        ["Terminal", `${renderer.width}×${renderer.height}  ${process.env.TERM ?? ""}`],
        ["Dados", caminhos.base()],
      ]),
    );
    linhaSuperior.add(ambiente);

    const cofre = statusCofre();
    const haSettings = existe(caminhos.settings());
    const estado = painel(renderer, tema, { titulo: "Estado", width: 46 });
    estado.add(
      tabelaChaveValor(renderer, tema, [
        ["settings.json", haSettings ? `${glifos.ok} gravado` : `${glifos.ponto} padrões`, haSettings ? tema.ok : tema.textoSutil],
        ["credentials.json", cofre.existe ? `${glifos.ok} ${cofre.quantidade} credencial(is)` : `${glifos.ponto} vazio`, cofre.existe ? tema.ok : tema.textoSutil],
        ["chave mestra", cofre.origemChave === "nenhuma" ? "não criada" : cofre.origemChave, cofre.origemChave === "env" ? tema.acentoSecundario : tema.texto],
        ["MCP", `${manifesto.bin} mcp`, tema.texto],
      ]),
    );
    linhaSuperior.add(estado);
    raiz.add(linhaSuperior);

    const linhaInferior = new BoxRenderable(renderer, { flexDirection: "row", flexGrow: 1 });

    const config = painel(renderer, tema, { titulo: "Configuração em vigor", flexGrow: 1 });
    let pares: Array<[string, string]>;
    try {
      pares = achatar(lerSettings()).map(([k, v]) => [k, JSON.stringify(v)]);
    } catch (e) {
      pares = [["erro", e instanceof Error ? e.message : String(e)]];
    }
    config.add(tabelaChaveValor(renderer, tema, pares.map(([k, v]) => [k, v, tema.texto])));
    linhaInferior.add(config);

    const acoes = painel(renderer, tema, { titulo: "Próximos passos", width: 46 });
    acoes.add(titulo(renderer, tema, "No terminal"));
    acoes.add(
      lista(renderer, tema, [
        `${manifesto.bin} --help`,
        `${manifesto.bin} credentials set <nome>`,
        `${manifesto.bin} config set tui.tema dia`,
        `${manifesto.bin} --skill`,
      ], glifos.seta),
    );
    acoes.add(espaco(renderer));
    acoes.add(titulo(renderer, tema, "Para agentes"));
    acoes.add(sutil(renderer, tema, `Cliente MCP: { "command": "${manifesto.bin}", "args": ["mcp"] }`));
    linhaInferior.add(acoes);
    raiz.add(linhaInferior);

    return raiz;
  },
};
