/**
 * Contrato de uma tela (aba) da TUI.
 *
 * Cada tela vive em `telas/<id>.ts`, exporta um objeto `Tela` e é registrada
 * em `telas/index.ts`. A tela recebe o renderer e o tema ao montar e devolve
 * o renderable raiz do seu conteúdo. `aoEntrar` e `aoSair` servem para
 * iniciar e parar timers ou assinaturas. O stub em `template/tela/` mostra
 * o esqueleto mínimo.
 */
import type { CliRenderer, Renderable } from "@opentui/core";
import type { Tema } from "./tema.ts";

export interface ContextoTela {
  renderer: CliRenderer;
  tema: Tema;
  /** Troca a aba ativa por id. */
  irPara: (id: string) => void;
  /** Encerra a TUI. */
  sair: () => void;
}

export interface Tela {
  /** Identificador estável, usado em `tui.abaInicial` e `--aba`. */
  id: string;
  /** Título curto da aba. */
  titulo: string;
  /** Linha mostrada sob as abas quando a aba está em foco. */
  descricao: string;
  /** Dicas de teclas próprias da tela, exibidas na barra inferior. */
  teclas?: ReadonlyArray<{ tecla: string; acao: string }>;
  /** Cria o conteúdo. Chamado uma vez. */
  montar: (ctx: ContextoTela) => Renderable;
  /** Chamado ao exibir a aba. */
  aoEntrar?: (ctx: ContextoTela) => void;
  /** Chamado ao esconder a aba. */
  aoSair?: (ctx: ContextoTela) => void;
  /** Teclas tratadas pela própria tela. Devolve `true` quando consumiu. */
  aoTecla?: (nome: string, ctx: ContextoTela) => boolean;
}
