/**
 * Stub de tela da TUI. Copie para src/tui/telas/<id>.ts, ajuste os imports e
 * registre em src/tui/telas/index.ts. Se o id puder ser aba inicial,
 * acrescente-o em tui.abaInicial (src/config/settings.ts) e em --aba.
 */
import { BoxRenderable } from "@opentui/core";
import { lista, painel, sutil, tabelaChaveValor, titulo } from "../../src/tui/componentes.ts";
import type { Tela } from "../../src/tui/tela.ts";

export const telaExemplo: Tela = {
  id: "exemplo",
  titulo: "Exemplo",
  descricao: "Uma linha sobre o que esta aba mostra",
  teclas: [{ tecla: "r", acao: "recarregar" }],
  montar: ({ renderer, tema }) => {
    const raiz = new BoxRenderable(renderer, { flexDirection: "column", flexGrow: 1 });

    const linha = new BoxRenderable(renderer, { flexDirection: "row", flexGrow: 1 });

    const principal = painel(renderer, tema, { titulo: "Principal", flexGrow: 1, destaque: true });
    principal.add(titulo(renderer, tema, "Valores"));
    principal.add(
      tabelaChaveValor(renderer, tema, [
        ["Chave", "valor"],
        ["Estado", "ok", tema.ok],
      ]),
    );
    linha.add(principal);

    const lateral = painel(renderer, tema, { titulo: "Lateral", width: 40 });
    lateral.add(sutil(renderer, tema, "Explique o painel em uma frase."));
    lateral.add(lista(renderer, tema, ["item um", "item dois"]));
    linha.add(lateral);

    raiz.add(linha);
    return raiz;
  },
  aoTecla: (nome) => {
    if (nome === "r") {
      // Recarregue dados aqui e atualize os TextRenderable guardados em closure.
      return true;
    }
    return false;
  },
};
