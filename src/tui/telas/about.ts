/**
 * Aba About: identidade do binário, versão, caminhos e créditos.
 * Usa os mesmos dados do comando `about`, então as duas superfícies nunca
 * contam histórias diferentes.
 */
import { BoxRenderable, TextRenderable } from "@opentui/core";
import { dadosAbout } from "../../cli/comandos/about.ts";
import { espaco, lista, painel, sutil, tabelaChaveValor, titulo } from "../componentes.ts";
import type { Tela } from "../tela.ts";

export const telaAbout: Tela = {
  id: "about",
  titulo: "About",
  descricao: "Binário, versão, licença e créditos",
  montar: ({ renderer, tema }) => {
    const d = dadosAbout();
    const raiz = new BoxRenderable(renderer, { flexDirection: "column", flexGrow: 1 });

    const topo = new BoxRenderable(renderer, { flexDirection: "row", flexShrink: 0 });

    const binario = painel(renderer, tema, { titulo: "Binário", flexGrow: 1, destaque: true });
    binario.add(new TextRenderable(renderer, { content: `${d.titulo}  v${d.versao}`, fg: tema.acento }));
    binario.add(sutil(renderer, tema, d.descricao));
    binario.add(espaco(renderer));
    binario.add(
      tabelaChaveValor(renderer, tema, [
        ["Executável", d.executavel],
        ["Runtime", d.runtime],
        ["Plataforma", d.plataforma],
        ["PID", String(d.pid)],
        ["Dados", d.diretorioDados],
      ]),
    );
    topo.add(binario);

    const projeto = painel(renderer, tema, { titulo: "Projeto", width: 58 });
    projeto.add(
      tabelaChaveValor(renderer, tema, [
        ["Autor", d.autor || "-", tema.textoForte],
        ["Licença", d.licenca],
        ["Site", d.site || "-", tema.acentoSecundario],
        ["Repositório", d.repositorio || "-", tema.acentoSecundario],
      ]),
    );
    topo.add(projeto);
    raiz.add(topo);

    const base = new BoxRenderable(renderer, { flexDirection: "row", flexGrow: 1 });

    const creditos = painel(renderer, tema, { titulo: "Créditos", flexGrow: 1 });
    creditos.add(
      tabelaChaveValor(renderer, tema, d.creditos.map((c) => [c.nome, `${c.papel}  ${c.url}`, tema.texto] as [string, string, string])),
    );
    base.add(creditos);

    const padroes = painel(renderer, tema, { titulo: "Padrões seguidos", width: 58 });
    padroes.add(titulo(renderer, tema, "Interface"));
    padroes.add(lista(renderer, tema, ["OpenCLI 0.1 para a descrição da CLI", "MCP 2025-11-25 via stdio", "Códigos de saída fixos (0 sucesso)"]));
    padroes.add(espaco(renderer));
    padroes.add(titulo(renderer, tema, "Dados"));
    padroes.add(lista(renderer, tema, ["settings.json em texto claro", "credentials.json com AES-256-GCM", "master.key com permissão 0600"]));
    base.add(padroes);
    raiz.add(base);

    return raiz;
  },
};
