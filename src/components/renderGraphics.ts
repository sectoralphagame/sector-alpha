import Color from "color";
import { add, matrix, Matrix } from "mathjs";
import * as PIXI from "pixi.js";
import { sectorSize } from "../archetypes/sector";
import { BaseComponent } from "./component";
import { hecsToCartesian } from "./hecsPosition";

export const graphics = {
  circle: ({
    g,
    opts,
  }: {
    g: PIXI.Graphics;
    opts: { color: string; position: Matrix; radius: number };
  }) => {
    g.lineStyle({
      alpha: 0.3,
      width: 1,
      color: Color(opts.color).rgbNumber(),
    });
    g.drawCircle(
      opts.position.get([0]) * 10,
      opts.position.get([1]) * 10,
      opts.radius * 10
    );
  },
  sector: ({
    g,
    opts,
  }: {
    g: PIXI.Graphics;
    opts: { position: Matrix; name: string };
  }) => {
    const pos = hecsToCartesian(opts.position, sectorSize);
    g.lineStyle({ color: 0x292929, width: 5 });
    g.drawRegularPolygon!(
      pos.get([0]),
      pos.get([1]),
      sectorSize,
      6,
      Math.PI / 6
    );
    const textGraphics = new PIXI.Text(opts.name, {
      fill: 0x404040,
      fontFamily: "Space Mono",
    });
    textGraphics.resolution = 8;
    const textPos = add(pos, matrix([0, 90 - sectorSize])) as Matrix;
    textGraphics.anchor.set(0.5, 0.5);
    textGraphics.position.set(textPos.get([0]), textPos.get([1]));
    g.addChild(textGraphics);
  },
};
export type Graphics = typeof graphics;

export interface RenderGraphics<T extends keyof Graphics>
  extends BaseComponent<"renderGraphics"> {
  draw: T;
  g: PIXI.Graphics;
  initialized: boolean;
  opts: Parameters<Graphics[T]>[0]["opts"];
}

export function createRenderGraphics<T extends keyof Graphics>(
  draw: T,
  opts: Parameters<Graphics[T]>[0]["opts"]
): RenderGraphics<T> {
  return {
    draw,
    initialized: false,
    g: new PIXI.Graphics(),
    name: "renderGraphics",
    opts,
  };
}

export function drawGraphics(
  component: RenderGraphics<any>,
  container: PIXI.Container
) {
  container.addChild(component.g);
  graphics[component.draw]({ g: component.g, opts: component.opts });
}
