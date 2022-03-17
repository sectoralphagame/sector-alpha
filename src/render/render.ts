import P5, { Camera } from "p5";
import Color from "color";
import { Sim } from "../sim";
import { limitMin } from "../utils/limit";
import "./components/Panel";
import { Ship } from "../entities/ship";

const zMin = 90;

const sizes = {
  ship: 0.5,
  facility: 2,
};

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
    this.update({ x: this.x, y: this.y, z: zMin });
  }

  update({ x, y, z }: Partial<RenderCamera>) {
    if (x) this.x -= x;
    if (y) this.y -= y;
    if (z) this.z = limitMin(z / 10 + this.z, zMin);
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
  // eslint-disable-next-line no-new
  new P5((p5: P5) => {
    let camera: RenderCamera;

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
      p5.background("black");

      sim.ships.forEach((ship) => {
        const selected = window.selected === ship;
        const color = selected
          ? Color(ship.owner.color).lighten(0.2).unitArray()
          : Color(ship.owner.color).unitArray();
        p5.fill(color[0] * 256, color[1] * 256, color[2] * 256);
        p5.noStroke();
        p5.circle(
          ship.position.get([0]) * 10,
          ship.position.get([1]) * 10,
          selected ? 1.3 * sizes.ship : sizes.ship
        );
      });

      sim.factions
        .map((faction) => faction.facilities)
        .flat()
        .forEach((facility) => {
          const color =
            window.selected === facility
              ? Color(facility.faction.color).lighten(0.2).unitArray()
              : Color(facility.faction.color).unitArray();
          p5.fill(color[0] * 256, color[1] * 256, color[2] * 256);
          p5.noStroke();
          p5.circle(
            facility.position.get([0]) * 10,
            facility.position.get([1]) * 10,
            sizes.facility
          );
        });
    };

    p5.mouseWheel = (event: { delta: number }) => {
      camera.update({
        z: event.delta,
      });
    };

    p5.mouseDragged = (event: MouseEvent) => {
      camera.update({
        x: (event.movementX * camera.z) / zMin / 10,
        y: (event.movementY * camera.z) / zMin / 10,
      });
    };

    p5.mouseClicked = () => {
      const clickables = [
        ...sim.ships,
        ...sim.factions.map((faction) => faction.facilities).flat(),
      ];
      const clicked = clickables.find((entity) => {
        const [x, y] = camera.translateScreenToCanvas(p5.mouseX, p5.mouseY);
        return (
          (entity.position.get([0]) * 10 - x) ** 2 +
            (entity.position.get([1]) * 10 - y) ** 2 <=
          (sizes[entity instanceof Ship ? "ship" : "facility"] *
            camera.scale) **
            2
        );
      });

      if (clicked) {
        window.selected = clicked;
      }
    };

    p5.windowResized = () => {
      p5.resizeCanvas(parent.clientWidth, parent.clientHeight);
      camera.update({});
    };
  });
}
