/**
 * Docs tab: embedded Markdown with a topic index and scrollable document.
 * Wide and medium show the index on the left; compact uses only the document
 * and t to choose its topic. Up/k, Down/j, PageUp/PageDown and g/G scroll.
 * Documentation is embedded at build time, so this screen has no file watch.
 * Registry loading is dynamic to avoid the CLI → TUI → registry import cycle.
 */
import {
  BoxRenderable,
  ScrollBoxRenderable,
  MarkdownRenderable,
  SyntaxStyle,
  LinearScrollAccel,
} from "@opentui/core";
import { SKILL_TOPICS, skillText } from "../../skill/index.ts";
import { listPanel, stateView } from "../components.ts";
import type { Screen, ScreenContext } from "../screen.ts";

/** Creates a documentation reader with independent topic and load lifecycle. */
export function createDocsScreen(): Screen {
  let topicIndex: ReturnType<typeof listPanel> | undefined;
  let topic = 0;
  let generation = 0;
  let document: ScrollBoxRenderable | undefined;
  let loadTopic: ((index: number) => Promise<void>) | undefined;

  /** Opens the topic chooser, also used when compact layout hides the index. */
  async function choose(ctx: ScreenContext): Promise<void> {
    const selected = await ctx.choose({
      title: "Documentation topic",
      items: SKILL_TOPICS,
      initial: topic,
    });
    if (selected !== undefined) await loadTopic?.(selected);
  }

  function scroll(delta: number): void {
    document?.scrollBy(delta);
  }

  function pageUp(): void {
    scroll(-Math.max(1, (document?.height ?? 10) - 1));
  }

  function pageDown(): void {
    scroll(Math.max(1, (document?.height ?? 10) - 1));
  }

  return {
    id: "docs",
    title: "Docs",
    icon: "docs",
    description: "Read the embedded documentation",
    actions: [
      { keys: ["t"], description: "choose topic", icon: "docs", run: choose },
      {
        keys: ["up", "k"],
        description: "scroll up",
        icon: "select",
        hidden: true,
        run: () => scroll(-1),
      },
      {
        keys: ["down", "j"],
        description: "scroll down",
        icon: "select",
        hidden: true,
        run: () => scroll(1),
      },
      {
        keys: ["pageup"],
        description: "page up",
        icon: "select",
        hidden: true,
        run: pageUp,
      },
      {
        keys: ["pagedown"],
        description: "page down",
        icon: "select",
        hidden: true,
        run: pageDown,
      },
      {
        keys: ["g", "home"],
        description: "start",
        icon: "select",
        hidden: true,
        run: () => document?.scrollTo(0),
      },
      {
        keys: ["G", "end"],
        description: "end",
        icon: "select",
        hidden: true,
        run: () => document?.scrollTo(Infinity),
      },
    ],
    onLeave: () => {
      generation++;
    },
    onEnter: () => {
      void loadTopic?.(topic);
    },
    mount(ctx) {
      const { renderer, theme, icons } = ctx;
      const root = new BoxRenderable(renderer, {
        flexDirection: "row",
        flexGrow: 1,
        minHeight: 0,
      });
      const host = new BoxRenderable(renderer, {
        flexDirection: "column",
        flexGrow: 1,
        minWidth: 0,
        minHeight: 0,
      });

      /** Releases the previous loading, error or document tree before replacement. */
      function clear(): void {
        for (const child of host.getChildren()) {
          host.remove(child);
          child.destroyRecursively();
        }
      }

      const style = SyntaxStyle.fromStyles(
        {
          default: { fg: theme.text },
          "markup.heading": { fg: theme.accent, bold: true },
          "markup.link": { fg: theme.accentSecondary, underline: true },
          "markup.raw": { fg: theme.textStrong },
        },
        renderer.nativeScene,
      );

      /** Invalidates pending loads before releasing the shared syntax style. */
      function cleanup(): void {
        generation++;
        style.destroy();
      }
      root.once("destroyed", cleanup);

      function chooseTopic(): void {
        void choose(ctx);
      }

      /** Loads a topic and ignores responses superseded by navigation or teardown. */
      async function load(index: number): Promise<void> {
        const selected = SKILL_TOPICS[index];
        if (!selected) return;

        topicIndex?.move(index - topicIndex.selected());
        topic = index;
        const request = ++generation;
        document = undefined;
        clear();
        host.add(
          stateView(renderer, theme, icons, {
            kind: "loading",
            title: "Loading documentation",
          }),
        );
        ctx.status(`docs: ${selected}`);

        try {
          // Import only after mounting to avoid the CLI → TUI → registry cycle.
          const { root: commands } = await import("../../cli/commands.ts");
          if (request !== generation || root.isDestroyed || renderer.isDestroyed) return;

          const content = skillText(commands, selected);
          clear();
          document = new ScrollBoxRenderable(renderer, {
            flexGrow: 1,
            minHeight: 0,
            scrollY: true,
            scrollX: false,
            scrollAcceleration: new LinearScrollAccel(),
          });
          document.add(
            new MarkdownRenderable(renderer, {
              content,
              syntaxStyle: style,
              fg: theme.text,
              width: "100%",
            }),
          );
          host.add(document);
        } catch (error) {
          if (request !== generation || root.isDestroyed || renderer.isDestroyed) return;

          clear();
          ctx.notify(
            error instanceof Error ? error.message : "Unable to load documentation",
            "error",
          );
          host.add(
            stateView(renderer, theme, icons, {
              kind: "error",
              title: "Unable to load documentation",
              action: { key: "t", label: "choose topic", onPress: chooseTopic },
            }),
          );
        }
      }
      loadTopic = load;

      function selectTopic(index: number): void {
        void loadTopic?.(index);
      }

      topicIndex = undefined;
      if (ctx.layout() !== "compact") {
        const index = listPanel(renderer, theme, {
          title: "Topics",
          items: [...SKILL_TOPICS],
          onSelect: selectTopic,
        });
        topicIndex = index;
        index.box.width = 24;
        index.box.flexGrow = 0;
        index.move(topic);
        root.add(index.box);
      }
      root.add(host);
      void loadTopic(topic);
      return root;
    },
  };
}

/** Default documentation tab registered by the shell. */
export const docsScreen = createDocsScreen();
