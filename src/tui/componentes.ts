/**
 * Componentes visuais reutilizados pelas telas.
 *
 * `painel` cria uma caixa com borda arredondada e título. `linhaChaveValor`
 * monta "rótulo  valor" com o rótulo apagado. `lista` empilha itens com
 * marcador. Tudo recebe o tema para manter as telas livres de cores fixas.
 */
import { BoxRenderable, TextRenderable, TextAttributes, type CliRenderer } from "@opentui/core";
import { glifos, type Tema } from "./tema.ts";

export function painel(
  renderer: CliRenderer,
  tema: Tema,
  opcoes: { titulo: string; flexGrow?: number; width?: number | "auto" | `${number}%`; height?: number | "auto" | `${number}%`; destaque?: boolean },
): BoxRenderable {
  return new BoxRenderable(renderer, {
    flexGrow: opcoes.flexGrow,
    width: opcoes.width,
    height: opcoes.height,
    flexDirection: "column",
    borderStyle: "rounded",
    borderColor: opcoes.destaque ? tema.bordaAtiva : tema.borda,
    title: ` ${opcoes.titulo} `,
    titleColor: opcoes.destaque ? tema.acento : tema.textoSutil,
    backgroundColor: tema.superficie,
    paddingLeft: 1,
    paddingRight: 1,
  });
}

export function linhaChaveValor(
  renderer: CliRenderer,
  tema: Tema,
  chave: string,
  valor: string,
  larguraChave: number,
  corValor?: string,
): BoxRenderable {
  const linha = new BoxRenderable(renderer, { flexDirection: "row", height: 1 });
  linha.add(
    new TextRenderable(renderer, {
      content: chave.padEnd(larguraChave),
      fg: tema.textoSutil,
      selectable: false,
    }),
  );
  linha.add(new TextRenderable(renderer, { content: "  " }));
  linha.add(new TextRenderable(renderer, { content: valor, fg: corValor ?? tema.texto, wrapMode: "none" }));
  return linha;
}

export function tabelaChaveValor(renderer: CliRenderer, tema: Tema, pares: Array<[string, string, string?]>): BoxRenderable {
  const caixa = new BoxRenderable(renderer, { flexDirection: "column" });
  const largura = Math.max(...pares.map(([k]) => k.length));
  for (const [k, v, c] of pares) caixa.add(linhaChaveValor(renderer, tema, k, v, largura, c));
  return caixa;
}

export function titulo(renderer: CliRenderer, tema: Tema, texto: string): TextRenderable {
  return new TextRenderable(renderer, { content: texto, fg: tema.textoForte, attributes: TextAttributes.BOLD });
}

export function sutil(renderer: CliRenderer, tema: Tema, texto: string): TextRenderable {
  return new TextRenderable(renderer, { content: texto, fg: tema.textoSutil });
}

export function lista(renderer: CliRenderer, tema: Tema, itens: string[], marcador = glifos.ponto): BoxRenderable {
  const caixa = new BoxRenderable(renderer, { flexDirection: "column" });
  for (const item of itens) {
    const linha = new BoxRenderable(renderer, { flexDirection: "row" });
    linha.add(new TextRenderable(renderer, { content: `${marcador} `, fg: tema.acento }));
    linha.add(new TextRenderable(renderer, { content: item, fg: tema.texto }));
    caixa.add(linha);
  }
  return caixa;
}

export function espaco(renderer: CliRenderer, altura = 1): BoxRenderable {
  return new BoxRenderable(renderer, { height: altura });
}
