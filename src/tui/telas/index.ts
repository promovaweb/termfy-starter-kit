/**
 * Registro das telas da TUI, na ordem das abas.
 * Para incluir uma aba: crie `telas/<id>.ts` e adicione aqui.
 */
import { telaAbout } from "./about.ts";
import { telaOverview } from "./overview.ts";
import type { Tela } from "../tela.ts";

export const telas: readonly Tela[] = [telaOverview, telaAbout];
