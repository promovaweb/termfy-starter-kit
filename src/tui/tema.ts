/**
 * Tema da TUI no estilo modern unix.
 *
 * Duas paletas: `noite` (padrão) e `dia`. Os nomes das cores seguem o papel
 * na interface, não o matiz, para que uma troca de paleta não exija mexer
 * nas telas. Bordas arredondadas, rótulos apagados e valores em destaque
 * compõem a hierarquia visual. A escolha vem de `tui.tema` em settings.json.
 */
import { lerSettings, obterCaminho } from "../config/settings.ts";

export interface Tema {
  nome: string;
  fundo: string;
  superficie: string;
  superficieAlta: string;
  borda: string;
  bordaAtiva: string;
  texto: string;
  textoSutil: string;
  textoForte: string;
  acento: string;
  acentoSecundario: string;
  ok: string;
  aviso: string;
  erro: string;
  barraFundo: string;
  barraTexto: string;
  teclaFundo: string;
  teclaTexto: string;
}

export const temas: Record<"noite" | "dia", Tema> = {
  noite: {
    nome: "noite",
    fundo: "#1a1b26",
    superficie: "#1f2335",
    superficieAlta: "#24283b",
    borda: "#3b4261",
    bordaAtiva: "#7aa2f7",
    texto: "#c0caf5",
    textoSutil: "#565f89",
    textoForte: "#e0e6ff",
    acento: "#7aa2f7",
    acentoSecundario: "#bb9af7",
    ok: "#9ece6a",
    aviso: "#e0af68",
    erro: "#f7768e",
    barraFundo: "#16161e",
    barraTexto: "#a9b1d6",
    teclaFundo: "#3d59a1",
    teclaTexto: "#ffffff",
  },
  dia: {
    nome: "dia",
    fundo: "#e1e2e7",
    superficie: "#d6d8df",
    superficieAlta: "#c4c8da",
    borda: "#a8aecb",
    bordaAtiva: "#2e7de9",
    texto: "#3760bf",
    textoSutil: "#848cb5",
    textoForte: "#1b2a5e",
    acento: "#2e7de9",
    acentoSecundario: "#9854f1",
    ok: "#587539",
    aviso: "#8c6c3e",
    erro: "#f52a65",
    barraFundo: "#c4c8da",
    barraTexto: "#3760bf",
    teclaFundo: "#2e7de9",
    teclaTexto: "#ffffff",
  },
};

/** Lê `tui.tema` e devolve a paleta. Qualquer falha cai em `noite`. */
export function temaAtual(): Tema {
  try {
    const nome = obterCaminho(lerSettings(), "tui.tema");
    if (nome === "dia") return temas.dia;
  } catch {
    // Sem settings legível, segue a paleta padrão.
  }
  return temas.noite;
}

/** Glifos usados nas telas; todos cabem em uma célula. */
export const glifos = {
  ponto: "•",
  seta: "→",
  ok: "✓",
  aviso: "!",
  erro: "✗",
  separador: "│",
  bloco: "▌",
};
