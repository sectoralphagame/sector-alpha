import type { Camera } from "ogl";
import { Vec2, Mat4, Vec3 } from "ogl";

const dPos = 0.05;
const dScale = 0.2;
const keymap = {
  w: { x: 0, y: -dPos },
  ArrowUp: { x: 0, y: -dPos },
  s: { x: 0, y: dPos },
  ArrowDown: { x: 0, y: dPos },
  a: { x: -dPos, y: 0 },
  ArrowLeft: { x: -dPos, y: 0 },
  d: { x: dPos, y: 0 },
  ArrowRight: { x: dPos, y: 0 },
  q: { rotate: Math.PI / 400 },
  e: { rotate: -Math.PI / 400 },
  x: { scale: -dScale },
  "=": { scale: -dScale },
  z: { scale: dScale },
  "-": { scale: dScale },
};

export class MapControl {
  camera: Camera;
  canvas: HTMLCanvasElement;
  lookAt: Vec3 = new Vec3();
  inclination = Math.PI / 6;
  azimuth = 0;
  distance = 10;
  keysPressed = new Set<string>();
  zoomRange = [10, 1000];

  dragPrev: Vec2 | null = null;
  mouse: Vec2 = new Vec2();

  constructor(camera: Camera) {
    this.camera = camera;

    document.addEventListener("pointerdown", (event) => {
      this.dragPrev = new Vec2(event.clientX, event.clientY);
      this.mouse.set(event.clientX, event.clientY);
    });
    document.addEventListener("pointerup", () => {
      this.dragPrev = null;
      this.mouse.set(0, 0);
    });
    document.addEventListener("mousemove", (event) => {
      if (this.dragPrev) {
        this.mouse.set(event.clientX, event.clientY);
      }
    });
    document.addEventListener("wheel", (event) => {
      this.distance += event.deltaY / 10;
    });

    document.addEventListener("keydown", (event) => {
      // if (
      //   event.target !== document.body ||
      //   Number(this.overlay?.children.length) > 0
      // )
      //   return;
      if (event.key in keymap) {
        event.stopPropagation();
      }
      this.keysPressed.add(event.key);
    });
    document.addEventListener("keyup", (event) => {
      this.keysPressed.delete(event.key);
    });
  }

  update = () => {
    const offset = new Vec3();

    if (this.dragPrev) {
      const move = this.mouse.clone().sub(this.dragPrev);
      offset.set(-move[1] / 100, 0, move[0] / 100);
      this.dragPrev.set(this.mouse);
    }

    for (const key of this.keysPressed) {
      if (keymap[key]?.x !== undefined) {
        offset.z -= (keymap[key].x * this.distance) / 10;
        offset.x += (keymap[key].y * this.distance) / 10;

        // this.settingsManager.cp.selectionManager.focused = false;
        // this.viewport.plugins.remove("follow");
      }

      if (keymap[key]?.scale !== undefined) {
        this.distance = Math.min(
          Math.max(
            this.zoomRange[0],
            this.distance + keymap[key].scale * (this.distance / 10)
          ),
          this.zoomRange[1]
        );
      }

      if (keymap[key]?.rotate !== undefined) {
        this.azimuth += keymap[key].rotate;
      }
    }

    // this.settingsManager.cp.camera.position = this.position;

    const s = Math.sin(this.azimuth);
    const c = Math.cos(this.azimuth);

    // prettier-ignore
    offset.applyMatrix4(
      new Mat4(
         c, 0, s, 0,
         0, 1, 0, 0,
        -s, 0, c, 0,
         0, 0, 0, 1
      )
    );

    this.lookAt.add(offset);
    this.camera.lookAt(this.lookAt);
    this.camera.position.set(
      new Vec3(
        Math.cos(this.azimuth) * Math.cos(this.inclination) * this.distance,
        Math.sin(this.inclination) * this.distance,
        Math.sin(this.azimuth) * Math.cos(this.inclination) * this.distance
      ).add(this.lookAt)
    );
  };
}
