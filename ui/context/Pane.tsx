import { storageHook } from "@core/hooks";
import type { GameSettings } from "@core/settings";
import type { FolderApi, FolderParams } from "tweakpane";
import { Pane as BasePane } from "tweakpane";

export class Pane extends BasePane {
  constructor() {
    super();

    this.element.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });
  }

  addOrReplaceFolder(props: FolderParams) {
    const existing = this.children.find(
      (c) => (c as FolderApi).title === props.title
    );
    if (existing) {
      existing.dispose();
    }

    return super.addFolder(props);
  }
}

export const pane = new Pane();
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
