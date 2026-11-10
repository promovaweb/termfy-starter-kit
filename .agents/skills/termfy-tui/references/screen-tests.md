# Testes de tela

O OpenTUI oferece `createTestRenderer` em `@opentui/core/testing`. Ele
renderiza em memória, sem terminal, e devolve o frame como texto.

```ts
import { createTestRenderer } from "@opentui/core/testing";
import { mountTui } from "../src/tui/index.ts";

const setup = await createTestRenderer({ width: 110, height: 30 });
const closed = mountTui(setup.renderer, { initialTab: "about" });
await setup.renderOnce();

const frame = setup.captureCharFrame();   // Visible frame text
setup.mockInput.pressKey("2");            // Digit, "left", "right", "tab", "escape"
await setup.renderOnce();
setup.mockInput.pressKey("q");
await closed;                          // mountTui resolves when the renderer is destroyed
```

Isole a pasta de dados com `process.env[HOME_VARIABLE] = temporaryDir` antes
de montar, para que o frame não dependa das configurações da máquina.
Importe `HOME_VARIABLE` de `src/config/paths.ts` e crie `temporaryDir`
com `mkdtempSync`.

## O que conferir

- Títulos dos painéis e rótulos principais presentes no frame.
- Troca de aba por dígito e por `right`.
- `?` mostra e esconde a caixa de ajuda.
- `q` destrói o renderer (`setup.renderer.isDestroyed === true`).
- Teclas próprias da tela produzem o efeito esperado no frame.

## Ver o frame

Para inspecionar visualmente, imprima `captureCharFrame()` em um script
temporário com `bun run`. Em terminal real, rode `bun run dev` e navegue.
