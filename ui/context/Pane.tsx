import { storageHook } from "@core/hooks";
import { defaultLogger } from "@core/log";
import type { GameSettings } from "@core/settings";
import { DraggableContainer } from "@ui/components/DraggableContainer/DraggableContainer";
import React from "react";
import type { FolderApi, FolderParams } from "tweakpane";
import { Pane as BasePane } from "tweakpane";

const logger = defaultLogger.sub("pane");

export class Pane extends BasePane {
  constructor({ container }: { container?: HTMLDivElement } = {}) {
    logger.log("Creating Pane");
    super({ container });

    this.element.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });
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

    return super.addFolder(props);
  }

  dispose() {
    logger.log("Disposing Pane");
    super.dispose();
  }
}

let pane = new Pane();
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
      pane.hidden = !process.env.STORYBOOK;
    }

    return () => {
      pane.dispose();
    };
  }, [container]);

  return (
    <DraggableContainer>
      <div ref={setContainer} />
    </DraggableContainer>
  );
};
