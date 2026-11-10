/**
 * Montagem da TUI.
 *
 * Estrutura da tela:
 *
 *   ┌ cabeçalho: título, versão e descrição ─────────────────────────────┐
 *   │ abas (TabSelect)                                                   │
 *   │ conteúdo da aba ativa (flexGrow)                                   │
 *   └ barra de status: teclas disponíveis ───────────────────────────────┘
 *
 * Teclas globais: Esquerda/Direita ou [ ] trocam a aba, 1..9 pulam para a
 * aba de mesmo número, Tab avança, q ou Esc encerram, ? alterna a ajuda.
 * O renderer é destruído em todas as saídas para devolver o terminal.
 */
import {
  BoxRenderable,
  TabSelectRenderable,
  TabSelectRenderableEvents,
  TextRenderable,
  TextAttributes,
  createCliRenderer,
  type CliRenderer,
  type KeyEvent,
  type Renderable,
} from "@opentui/core";
import { manifesto } from "../app/manifesto.ts";
import { lerSettings, obterCaminho } from "../config/settings.ts";
import { glifos, temaAtual, type Tema } from "./tema.ts";
import { telas } from "./telas/index.ts";
import type { ContextoTela, Tela } from "./tela.ts";

export interface OpcoesTui {
  abaInicial?: string;
}

function abaInicialPadrao(): string {
  try {
    const valor = obterCaminho(lerSettings(), "tui.abaInicial");
    if (typeof valor === "string") return valor;
  } catch {
    // Sem settings, usa a primeira aba.
  }
  return telas[0]?.id ?? "overview";
}

function barraDeTeclas(renderer: CliRenderer, tema: Tema, pares: ReadonlyArray<{ tecla: string; acao: string }>): BoxRenderable {
  const barra = new BoxRenderable(renderer, {
    height: 1,
    flexDirection: "row",
    backgroundColor: tema.barraFundo,
    paddingLeft: 1,
    gap: 2,
  });
  for (const { tecla, acao } of pares) {
    const item = new BoxRenderable(renderer, { flexDirection: "row" });
    item.add(new TextRenderable(renderer, { content: ` ${tecla} `, fg: tema.teclaTexto, bg: tema.teclaFundo, selectable: false }));
    item.add(new TextRenderable(renderer, { content: ` ${acao}`, fg: tema.barraTexto, selectable: false }));
    barra.add(item);
  }
  return barra;
}

/** Abre a TUI em um terminal real e só devolve quando o usuário sair. */
export async function iniciarTui(opcoes: OpcoesTui = {}): Promise<void> {
  const tema = temaAtual();
  const renderer = await createCliRenderer({ exitOnCtrlC: true, backgroundColor: tema.fundo, targetFps: 30 });
  await montarTui(renderer, opcoes, tema);
}

/**
 * Monta a interface em um renderer já criado e devolve quando ele for
 * destruído. Separado de `iniciarTui` para que os testes usem o renderer de
 * `@opentui/core/testing` e capturem frames sem um terminal real.
 */
export async function montarTui(renderer: CliRenderer, opcoes: OpcoesTui = {}, tema: Tema = temaAtual()): Promise<void> {

  const encerrado = new Promise<void>((resolver) => renderer.once("destroy", () => resolver()));
  const sair = () => renderer.destroy();

  const app = new BoxRenderable(renderer, {
    width: "100%",
    height: "100%",
    flexDirection: "column",
    backgroundColor: tema.fundo,
  });

  const cabecalho = new BoxRenderable(renderer, {
    height: 1,
    flexDirection: "row",
    paddingLeft: 1,
    paddingRight: 1,
    gap: 2,
  });
  const marca = new BoxRenderable(renderer, { flexDirection: "row", flexShrink: 0 });
  marca.add(new TextRenderable(renderer, { content: `${glifos.bloco} `, fg: tema.acento, selectable: false }));
  marca.add(new TextRenderable(renderer, { content: manifesto.titulo, fg: tema.textoForte, attributes: TextAttributes.BOLD }));
  marca.add(new TextRenderable(renderer, { content: ` v${manifesto.versao}`, fg: tema.textoSutil }));
  cabecalho.add(marca);
  cabecalho.add(
    new TextRenderable(renderer, {
      content: `${glifos.separador}  ${manifesto.descricao}`,
      fg: tema.textoSutil,
      wrapMode: "none",
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 0,
      height: 1,
    }),
  );
  cabecalho.add(
    new TextRenderable(renderer, {
      content: `${process.platform}-${process.arch} ${glifos.ponto} Bun ${Bun.version}`,
      fg: tema.textoSutil,
      flexShrink: 0,
      wrapMode: "none",
    }),
  );
  app.add(cabecalho);

  const filete = new BoxRenderable(renderer, { height: 1, paddingLeft: 1, paddingRight: 1 });
  filete.add(new TextRenderable(renderer, { content: "─".repeat(400), fg: tema.borda, wrapMode: "none", height: 1, selectable: false }));
  app.add(filete);

  const abas = new TabSelectRenderable(renderer, {
    width: "100%",
    height: 2,
    tabWidth: 14,
    options: telas.map((t) => ({ name: t.titulo, description: t.descricao })),
    backgroundColor: tema.fundo,
    textColor: tema.textoSutil,
    focusedBackgroundColor: tema.fundo,
    focusedTextColor: tema.textoSutil,
    selectedBackgroundColor: tema.superficieAlta,
    selectedTextColor: tema.acento,
    selectedDescriptionColor: tema.textoSutil,
    showDescription: false,
    showScrollArrows: false,
    wrapSelection: true,
  });
  app.add(abas);

  const conteudo = new BoxRenderable(renderer, { flexGrow: 1, flexDirection: "column", paddingLeft: 1, paddingRight: 1 });
  app.add(conteudo);

  const teclasGlobais = [
    { tecla: "←/→", acao: "aba" },
    { tecla: "1-9", acao: "ir" },
    { tecla: "?", acao: "ajuda" },
    { tecla: "q", acao: "sair" },
  ];
  let rodape = barraDeTeclas(renderer, tema, teclasGlobais);
  app.add(rodape);
  renderer.root.add(app);

  const montadas = new Map<string, Renderable>();
  let ativa: Tela | undefined;
  let ajudaVisivel = false;
  let caixaAjuda: BoxRenderable | undefined;

  const contexto: ContextoTela = {
    renderer,
    tema,
    irPara: (id) => {
      const indice = telas.findIndex((t) => t.id === id);
      if (indice >= 0) abas.setSelectedIndex(indice);
    },
    sair,
  };

  const atualizarRodape = (tela: Tela) => {
    app.remove(rodape);
    rodape = barraDeTeclas(renderer, tema, [...(tela.teclas ?? []), ...teclasGlobais]);
    app.add(rodape);
  };

  const exibir = (indice: number) => {
    const tela = telas[indice];
    if (!tela || tela === ativa) return;
    if (ativa) {
      ativa.aoSair?.(contexto);
      const anterior = montadas.get(ativa.id);
      if (anterior) conteudo.remove(anterior);
    }
    let montada = montadas.get(tela.id);
    if (!montada) {
      montada = tela.montar(contexto);
      montadas.set(tela.id, montada);
    }
    conteudo.add(montada);
    ativa = tela;
    tela.aoEntrar?.(contexto);
    atualizarRodape(tela);
  };

  const alternarAjuda = () => {
    ajudaVisivel = !ajudaVisivel;
    if (ajudaVisivel) {
      caixaAjuda = new BoxRenderable(renderer, {
        position: "absolute",
        right: 2,
        top: 4,
        width: 46,
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: tema.bordaAtiva,
        backgroundColor: tema.superficieAlta,
        title: " Teclas ",
        titleColor: tema.acento,
        paddingLeft: 1,
        paddingRight: 1,
        zIndex: 10,
      });
      const linhas: Array<[string, string]> = [
        ["←  →  [  ]", "aba anterior / seguinte"],
        ["Tab", "próxima aba"],
        ["1 … 9", "ir para a aba de mesmo número"],
        ["?", "mostrar ou esconder esta ajuda"],
        ["q  Esc  Ctrl+C", "sair"],
      ];
      for (const [k, v] of linhas) {
        const linha = new BoxRenderable(renderer, { flexDirection: "row" });
        linha.add(new TextRenderable(renderer, { content: k.padEnd(16), fg: tema.acento }));
        linha.add(new TextRenderable(renderer, { content: v, fg: tema.texto }));
        caixaAjuda.add(linha);
      }
      renderer.root.add(caixaAjuda);
    } else if (caixaAjuda) {
      renderer.root.remove(caixaAjuda);
      caixaAjuda = undefined;
    }
  };

  abas.on(TabSelectRenderableEvents.SELECTION_CHANGED, (indice: number) => exibir(indice));
  abas.on(TabSelectRenderableEvents.ITEM_SELECTED, (indice: number) => exibir(indice));

  const aoTecla = (key: KeyEvent) => {
    if (ativa?.aoTecla?.(key.name, contexto)) return;
    switch (key.name) {
      case "q":
      case "escape":
        sair();
        return;
      case "?":
        alternarAjuda();
        return;
      case "tab":
        abas.setSelectedIndex((abas.getSelectedIndex() + 1) % telas.length);
        return;
      default:
        break;
    }
    if (/^[1-9]$/.test(key.name)) {
      const indice = Number(key.name) - 1;
      if (indice < telas.length) abas.setSelectedIndex(indice);
    }
  };
  renderer.keyInput.on("keypress", aoTecla);
  renderer.once("destroy", () => renderer.keyInput.off("keypress", aoTecla));

  const inicial = opcoes.abaInicial ?? abaInicialPadrao();
  const indiceInicial = Math.max(0, telas.findIndex((t) => t.id === inicial));
  abas.focus();
  abas.setSelectedIndex(indiceInicial);
  exibir(indiceInicial);

  await encerrado;
}
