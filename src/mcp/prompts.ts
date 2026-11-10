/**
 * Prompts: modelos de conversa que ajudam o agente a operar o binário.
 * O esqueleto traz um único prompt de orientação; projetos derivados
 * acrescentam prompts específicos do domínio.
 */
import { z } from "zod";
import { manifesto } from "../app/manifesto.ts";
import type { Registrador } from "./servidor.ts";

export function registrarPrompts({ servidor, catalogo }: Registrador): void {
  catalogo.prompts.push({ nome: "operar", descricao: "Orienta o agente a ler a documentação e executar uma tarefa pelo CLI." });
  servidor.registerPrompt(
    "operar",
    {
      title: `Operar o ${manifesto.titulo}`,
      description: "Monta uma instrução para o agente ler a documentação embutida e cumprir uma tarefa usando o CLI com --json.",
      argsSchema: { tarefa: z.string().describe("O que o usuário quer fazer com o binário.") },
    },
    ({ tarefa }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `Você vai operar o binário "${manifesto.bin}" (v${manifesto.versao}). ` +
              `Primeiro chame a tool "skill" com o tópico "cli" para conhecer os comandos, opções e códigos de saída. ` +
              `Depois execute os comandos necessários sempre com a opção --json e trate o código de saída: 0 é sucesso, ` +
              `2 é uso inválido, 3 configuração, 4 credenciais. Nunca peça ao usuário o valor de uma credencial no chat; ` +
              `oriente a rodar "${manifesto.bin} credentials set <nome>" no próprio terminal.\n\nTarefa: ${tarefa}`,
          },
        },
      ],
    }),
  );
}
