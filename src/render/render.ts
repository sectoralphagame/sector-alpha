import P5, { Camera } from "p5";
import Color from "color";
import { Sim } from "../sim";
import { limit } from "../utils/limit";
import "./components/Panel";

const zMin = 90;
const zMax = 1200;

class RenderCamera {
  x = 0;
  y = 0;
  z = 0;
  camera: Camera;
  p5: P5;

  w: number;
  h: number;
  scale: number;

  constructor(p5: P5) {
    this.p5 = p5;
    this.camera = p5.createCamera();
    this.move({ x: this.x, y: this.y, z: 1e4 });
  }

  updateViewport() {
    this.camera.lookAt(this.x, this.y, 0);
    this.camera.setPosition(this.x, this.y, this.z);
    this.w =
      2 *
      (this.camera as any).aspectRatio *
      this.z *
      Math.tan((this.camera as any).cameraFOV / 2);
    this.h = this.w / (this.camera as any).aspectRatio;
    this.scale = this.p5.width / this.w;
  }

  move({ x, y, z }: Partial<RenderCamera>) {
    if (x) this.x -= x;
    if (y) this.y -= y;
    if (z) this.z = limit(z / 10 + this.z, zMin, zMax);
    this.updateViewport();
  }

  lookAt(x: number, y: number): void {
    this.x = x * 10;
    this.y = y * 10;
    this.updateViewport();
  }

  translateScreenToCanvas(x: number, y: number): [number, number] {
    return [
      x / this.scale - this.w / 2 + this.x,
      y / this.scale - this.h / 2 + this.y,
    ];
  }

  translateCanvasToScreen(x: number, y: number): [number, number] {
    return [
      this.scale * (x + this.w / 2 - this.x),
      this.scale * (y + this.h / 2 - this.y),
    ];
  }
}

export function render(sim: Sim, parent: Element) {
  window.renderer = {};

  // eslint-disable-next-line no-new
  new P5((p5: P5) => {
    let camera: RenderCamera;
    const settingsEntity = sim.entities.find((e) =>
      e.hasComponents(["selectionManager"])
    );

    p5.setup = () => {
      const canvas = p5.createCanvas(
        window.innerWidth,
        window.innerHeight,
        "webgl"
      );
      canvas.parent(parent);
      camera = new RenderCamera(p5);
    };

    p5.draw = () => {
      if (settingsEntity.cp.selectionManager.focused) {
        camera.lookAt(
          settingsEntity.cp.selectionManager.entity.cp.position.x,
          settingsEntity.cp.selectionManager.entity.cp.position.y
        );
      }
      p5.background("black");

      sim.entities
        .filter((e) => e.hasComponents(["render"]))
        .forEach((entity) => {
          const selected = settingsEntity.cp.selectionManager.entity === entity;
          if (camera.scale < entity.cp.render.minScale && !selected) return;

          const baseColor =
            entity.cp.render.color ?? entity.cp.owner?.value.color ?? "#dddddd";
          const color =
            settingsEntity.cp.selectionManager.entity === entity
              ? Color(baseColor).lighten(0.2).unitArray()
              : Color(baseColor).unitArray();
          p5.fill(color[0] * 256, color[1] * 256, color[2] * 256);
          p5.noStroke();
          p5.circle(
            entity.cp.position.x * 10,
            entity.cp.position.y * 10,
            (camera.z / zMin) * (selected ? 1.3 : 1) * entity.cp.render.size
          );
        });
    };

    p5.mouseWheel = (event: { delta: number }) => {
      camera.move({
        z: event.delta,
      });
    };

    p5.mouseDragged = (event: MouseEvent) => {
      settingsEntity.cp.selectionManager.focused = false;
      camera.move({
        x: (event.movementX * camera.z) / zMin / 10,
        y: (event.movementY * camera.z) / zMin / 10,
      });
    };

    p5.mouseClicked = () => {
      const clickables = sim.entities.filter((e) => e.cp.selection);
      const clicked = clickables.find((entity) => {
        const [x, y] = camera.translateScreenToCanvas(p5.mouseX, p5.mouseY);
        return (
          (entity.cp.position.x * 10 - x) ** 2 +
            (entity.cp.position.y * 10 - y) ** 2 <=
          (camera.z / zMin) * entity.cp.render.size * 2
        );
      });

      if (clicked) {
        settingsEntity.cp.selectionManager.set(clicked);
      }
    };

    p5.windowResized = () => {
      p5.resizeCanvas(parent.clientWidth, parent.clientHeight);
      camera.updateViewport();
    };
  });
}
