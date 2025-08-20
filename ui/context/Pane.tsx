import { eventHook } from "@core/events/pubsub";
import { storageHook } from "@core/hooks";
import { defaultLogger } from "@core/log";
import type { GameSettings } from "@core/settings";
import {
  SingleLogController,
  createPlugin,
  formatString,
} from "@tweakpane/core";
import { DraggableContainer } from "@ui/components/DraggableContainer/DraggableContainer";
import { Vec2, Vec3 } from "ogl";
import React from "react";
import type {
  FolderApi,
  FolderParams,
  TpPlugin,
  TpPluginBundle,
} from "tweakpane";
import { Pane as BasePane } from "tweakpane";

const logger = defaultLogger.sub("pane");

export function formatVec2(v: Vec2): string {
  return `(${v.x.toFixed(3)}, ${v.y.toFixed(3)})`;
}

export function formatVec3(v: Vec3): string {
  return `(${v.x.toFixed(3)}, ${v.y.toFixed(3)}, ${v.z.toFixed(3)})`;
}
const vec2Plugin: TpPlugin = createPlugin({
  accept: (v: unknown, params: Record<string, unknown>) => {
    if (v instanceof Vec2) {
      return {
        initialValue: params?.format
          ? (params.format as Function)(v)
          : formatVec2(v),
        params,
      };
    }

    return null;
  },
  // @ts-expect-error
  binding: {
    reader: (args) => (v: Vec2) =>
      args.params.format ? (args.params.format as Function)(v) : formatVec2(v),
  },
  controller: (args) =>
    new SingleLogController(args.document, {
      formatter: formatString,
      value: args.value,
      viewProps: args.viewProps,
    }),
  type: "monitor",
  id: "vec2",
});

const vec3Plugin: TpPlugin = createPlugin({
  accept: (v: unknown, params: Record<string, unknown>) => {
    if (v instanceof Vec3) {
      return {
        initialValue: params?.format
          ? (params.format as Function)(v)
          : formatVec3(v),
        params,
      };
    }

    return null;
  },
  // @ts-expect-error
  binding: {
    reader: (args) => (v: Vec3) =>
      args.params.format ? (args.params.format as Function)(v) : formatVec3(v),
  },
  controller: (args) =>
    new SingleLogController(args.document, {
      formatter: formatString,
      value: args.value,
      viewProps: args.viewProps,
    }),
  type: "monitor",
  id: "vec2",
});

const OglPlugin: TpPluginBundle = {
  id: "ogl",
  plugins: [vec2Plugin, vec3Plugin],
};

export class Pane extends BasePane {
  debug: {
    folder: FolderApi;
    values: Record<string, string | number>;
    unsubscribe: () => void;
  };

  constructor({ container }: { container?: HTMLDivElement } = {}) {
    logger.log("Creating Pane");
    super({ container });

    this.element.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });

    this.debug = {
      folder: this.addFolder({
        title: "Debug",
      }),
      values: {},
      unsubscribe: eventHook.subscribe(
        "update-debug",
        this.updateDebugValue.bind(this)
      ),
    };
  }

  addOrReplaceFolder(props: FolderParams) {
    logger.log(`Adding ${props.title} folder`);
    const existing = this.children.find(
      (c) => (c as FolderApi).title === props.title
    );
    if (existing) {
      logger.log(`Replacing ${(existing as FolderApi).title} folder`);
      existing.dispose();
    }

    return super.addFolder({
      expanded: false,
      ...props,
    });
  }

  updateDebugValue(event: { data: string | number; name: string }) {
    if (this.debug.values[event.name] === undefined) {
      this.debug.values[event.name] = event.data;
      this.debug.folder.addBinding(this.debug.values, event.name, {
        readonly: true,
        interval: 200,
        label: event.name,
      });
    } else {
      this.debug.values[event.name] = event.data;
    }
  }

  dispose() {
    logger.log("Disposing Pane");
    this.debug.unsubscribe();
    super.dispose();
  }
}

let pane = new Pane();
pane.registerPlugin(OglPlugin);
pane.hidden = !process.env.STORYBOOK;

storageHook.subscribe("Pane", (key) => {
  if (key === "gameSettings") {
    const settings = JSON.parse(
      localStorage.getItem("gameSettings")!
    ) as GameSettings;

    if (settings.dev) {
      pane.hidden = false;
    } else {
      pane.hidden = true;
    }
  }
});

export function getPane(): Pane {
  return pane;
}

export const DraggablePane: React.FC = () => {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (container !== null) {
      pane = new Pane({ container });
      pane.registerPlugin(OglPlugin);
      pane.hidden = !(
        process.env.STORYBOOK ||
        window.location.pathname.startsWith("/dev/scenarios/")
      );
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "KeyK" && (event.metaKey || event.ctrlKey)) {
        getPane().hidden = !getPane().hidden;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      pane.dispose();
    };
  }, [container]);

  return (
    <DraggableContainer>
      <div ref={setContainer} />
    </DraggableContainer>
  );
};
