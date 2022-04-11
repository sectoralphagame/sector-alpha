import P5, { Camera } from "p5";
import Color from "color";
import { Sim } from "../sim";
import { limitMin } from "../utils/limit";
import "./components/Panel";
import { Ship } from "../entities/ship";
import { MineableCommodity } from "../economy/commodity";

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
    if (z) this.z = limitMin(z / 10 + this.z, zMin);
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

const fieldColors: Record<MineableCommodity, string> = {
  fuelium: "#ffab6b",
  gold: "#ffe46b",
  ice: "#e8ffff",
  ore: "#ff5c7a",
};

export function render(sim: Sim, parent: Element) {
  window.renderer = {};

  // eslint-disable-next-line no-new
  new P5((p5: P5) => {
    let camera: RenderCamera;
    // eslint-disable-next-line no-unused-vars

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
      if (window.renderer.focused) {
        camera.lookAt(
          window.renderer.focused.position.get([0]),
          window.renderer.focused.position.get([1])
        );
      }
      p5.background("black");

      sim.fields.forEach((field) => {
        const color = Color(fieldColors[field.type]).unitArray();
        p5.fill(color[0] * 256, color[1] * 256, color[2] * 256, 64);
        p5.noStroke();
        p5.beginShape();

        field.outline.forEach((point) => {
          p5.curveVertex(point.get([0]) * 10, point.get([1]) * 10);
        });

        p5.curveVertex(
          field.outline[0].get([0]) * 10,
          field.outline[0].get([1]) * 10
        );
        p5.curveVertex(
          field.outline[1].get([0]) * 10,
          field.outline[1].get([1]) * 10
        );
        p5.curveVertex(
          field.outline[2].get([0]) * 10,
          field.outline[2].get([1]) * 10
        );
        p5.endShape();

        if (camera.scale > 5) {
          p5.fill(color[0] * 256, color[1] * 256, color[2] * 256, 128);
          field.rocks.forEach((rock) => {
            p5.circle(
              rock.position.get([0]) * 10,
              rock.position.get([1]) * 10,
              0.5
            );
          });
        }
      });

      if (camera.scale > 1) {
        sim.ships.forEach((ship) => {
          const selected = window.selected === ship;
          const color = selected
            ? Color(ship.owner.color)
                .lighten(0.2)
                .unitArray()
            : Color(ship.owner.color).unitArray();
          p5.fill(color[0] * 256, color[1] * 256, color[2] * 256);
          p5.noStroke();
          p5.circle(
            ship.position.get([0]) * 10,
            ship.position.get([1]) * 10,
            (camera.z / zMin) * (selected ? 1.3 : 1) * sizes.ship
          );
        });
      }
      if (camera.scale > 0.8) {
        sim.factions
          .map((faction) => faction.facilities)
          .flat()
          .forEach((facility) => {
            const selected = window.selected === facility;
            const color =
              window.selected === facility
                ? Color(facility.owner.color)
                    .lighten(0.2)
                    .unitArray()
                : Color(facility.owner.color).unitArray();
            p5.fill(color[0] * 256, color[1] * 256, color[2] * 256);
            p5.noStroke();
            p5.circle(
              facility.position.get([0]) * 10,
              facility.position.get([1]) * 10,
              (camera.z / zMin) * (selected ? 1.3 : 1) * sizes.facility
            );
          });
      }
    };

    p5.mouseWheel = (event: { delta: number }) => {
      camera.move({
        z: event.delta,
      });
    };

    p5.mouseDragged = (event: MouseEvent) => {
      window.renderer.focused = null;
      camera.move({
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
          (camera.z / zMin) *
            sizes[entity instanceof Ship ? "ship" : "facility"] *
            2
        );
      });

      if (clicked) {
        window.selected = clicked;
      }
    };

    p5.windowResized = () => {
      p5.resizeCanvas(parent.clientWidth, parent.clientHeight);
      camera.updateViewport();
    };
  });
}
