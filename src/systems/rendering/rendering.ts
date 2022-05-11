import P5 from "p5";
import Color from "color";
import { Sim } from "../../sim";
import "./components/Panel";
import { System } from "../system";
import { RenderCamera, zMin } from "./camera";
import { Query } from "../query";

export class RenderingSystem extends System {
  renderable: Query<"render" | "position">;
  selectable: Query<"selection" | "position">;
  parent: Element;
  p5: P5;

  constructor(sim: Sim) {
    super(sim);
    this.parent = document.querySelector("#canvasRoot");
    this.renderable = new Query(sim, ["render", "position"]);
    this.selectable = new Query(sim, ["selection", "position"]);

    this.init();
  }

  init = () => {
    this.p5 = new P5((p5: P5) => {
      let camera: RenderCamera;
      const settingsEntity = this.sim.queries.selectionManager.get()[0];

      p5.setup = () => {
        const canvas = p5.createCanvas(
          window.innerWidth,
          window.innerHeight,
          "webgl"
        );
        canvas.parent(this.parent);
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

        this.renderable.get().forEach((entity) => {
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
        const clickables = this.selectable.get().filter((e) => e.cp.selection);
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
        p5.resizeCanvas(this.parent.clientWidth, this.parent.clientHeight);
        camera.updateViewport();
      };
    });
  };

  // eslint-disable-next-line no-unused-vars, class-methods-use-this
  exec(): void {}
}
