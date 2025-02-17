import type { FolderApi } from "tweakpane";
import { Camera as BaseCamera, Vec3 } from "ogl";
import { pane } from "@ui/context/Pane";
import type { Engine } from "./engine";

const tempVec3 = new Vec3();

export class Camera extends BaseCamera {
  name = "Camera";
  engine: Engine;

  private paneFolder: FolderApi;

  constructor(engine: Engine) {
    super(engine.gl);
    this.engine = engine;

    this.initPane();
  }

  private initPane() {
    if (pane.children.find((child) => (child as FolderApi).title === "Camera"))
      return;

    this.paneFolder = pane.addFolder({
      title: "Camera",
    });
    const p = this.paneFolder.addBinding(this, "position");
    const r = this.paneFolder.addBinding(this, "rotation");
    this.paneFolder
      .addButton({
        title: "refresh",
      })
      .on("click", () => {
        p.refresh();
        r.refresh();
      });
  }

  disablePane() {
    this.paneFolder?.dispose();
  }

  distanceFromFocus() {
    const cameraPos = this.engine.camera.position;
    const cameraDir = tempVec3.set(
      -this.engine.camera.viewMatrix[2], // X
      -this.engine.camera.viewMatrix[6], // Y
      -this.engine.camera.viewMatrix[10] // Z
    );

    const t = -cameraPos.y / cameraDir.y; // Find intersection with XZ plane

    return new Vec3(
      cameraPos.x + t * cameraDir.x,
      0,
      cameraPos.z + t * cameraDir.z
    );
  }
}
