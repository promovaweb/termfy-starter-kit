/**
 * Mouse behavior shared by every clickable element of the TUI.
 *
 * `clickable` wires a renderable for the mouse: a left click runs the
 * handler and stops propagation (a button inside a clickable panel runs
 * once), hover calls `onHover(true|false)` and asks the terminal for the
 * hand pointer (OSC 22) while the pointer is over it. Right click and wheel
 * never run the handler. Terminals without pointer shapes ignore the
 * request, so the call is safe everywhere.
 */
import { ScrollBoxRenderable, TextRenderable, TextAttributes, type CliRenderer, type MouseEvent, type Renderable } from "@opentui/core";

export interface ClickableOptions {
  /** Runs on a left click. */
  onClick: () => void;
  onActivate?: () => void;
  onFocus?: () => void;
  /** Runs when the pointer enters (`true`) or leaves (`false`). */
  onHover?: (inside: boolean) => void;
}

const activations = new WeakMap<Renderable, () => void>();

/** Runs the focused control before the screen handles its own Enter binding. */
export function activateFocused(node: Renderable | null): boolean {
  const run = node && activations.get(node);
  if (!run) return false;
  run();
  return true;
}

/** Sets the pointer shape, ignoring terminals or test renderers that reject it. */
function pointer(renderer: CliRenderer, style: "pointer" | "default"): void {
  try {
    renderer.setMousePointer(style);
  } catch {
    // Pointer shapes are optional.
  }
}

/** Makes `node` clickable with hover feedback and the hand pointer. Returns `node`. */
export function clickable<T extends Renderable>(renderer: CliRenderer, node: T, options: ClickableOptions): T {
  activations.set(node, options.onActivate ?? options.onClick);
  node.focusable = true;
  const underlined = new Set<TextRenderable>();
  node.on("focused", () => {
    const highlight = (child: Renderable) => {
      if (child instanceof TextRenderable && !(child.attributes & TextAttributes.UNDERLINE)) {
        child.attributes |= TextAttributes.UNDERLINE;
        underlined.add(child);
      }
      child.getChildren().forEach(highlight);
    };
    options.onFocus?.();
    highlight(node);
    for (let parent = node.parent; parent; parent = parent.parent) {
      if (parent instanceof ScrollBoxRenderable) parent.scrollChildIntoView(node);
    }
  });
  node.on("blurred", () => {
    for (const text of underlined) if (!text.isDestroyed) text.attributes &= ~TextAttributes.UNDERLINE;
    underlined.clear();
  });
  node.onMouseDown = (event: MouseEvent) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    options.onClick();
  };
  node.onMouseOver = () => {
    pointer(renderer, "pointer");
    options.onHover?.(true);
  };
  node.onMouseOut = () => {
    pointer(renderer, "default");
    options.onHover?.(false);
  };
  return node;
}
