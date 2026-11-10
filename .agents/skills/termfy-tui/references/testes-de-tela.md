# Testes de tela

O OpenTUI oferece `createTestRenderer` em `@opentui/core/testing`. Ele
renderiza em memória, sem terminal, e devolve o frame como texto.

```ts
import { createTestRenderer } from "@opentui/core/testing";
import { montarTui } from "../src/tui/index.ts";

const setup = await createTestRenderer({ width: 110, height: 30 });
const encerrada = montarTui(setup.renderer, { abaInicial: "about" });
await setup.renderOnce();

const frame = setup.captureCharFrame();   // string com o conteúdo visível
setup.mockInput.pressKey("2");            // dígito, "left", "right", "tab", "escape"
await setup.renderOnce();
setup.mockInput.pressKey("q");
await encerrada;                          // montarTui devolve quando o renderer é destruído
```

Isole a pasta de dados com `process.env.<BIN>_HOME = mkdtempSync(...)` antes
de montar, para que o frame não dependa das configurações da máquina.

## O que conferir

- Títulos dos painéis e rótulos principais presentes no frame.
- Troca de aba por dígito e por `right`.
- `?` mostra e esconde a caixa de ajuda.
- `q` destrói o renderer (`setup.renderer.isDestroyed === true`).
- Teclas próprias da tela produzem o efeito esperado no frame.

## Ver o frame

Para inspecionar visualmente, imprima `captureCharFrame()` em um script
temporário com `bun run`. Em terminal real, rode `bun run dev` e navegue.
