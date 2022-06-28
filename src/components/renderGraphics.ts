import Color from "color";
import { add, matrix, Matrix } from "mathjs";
import * as PIXI from "pixi.js";
import { fieldColors } from "../archetypes/asteroid";
import { sectorSize } from "../archetypes/sector";
import { RequireComponent } from "../tsHelpers";
import { BaseComponent } from "./component";
import { Entity } from "./entity";
import { hecsToCartesian } from "./hecsPosition";

export type Graphics = Record<
  "circle" | "sector",
  // eslint-disable-next-line no-unused-vars
  (opts: { g: PIXI.Graphics; entity: Entity }) => void
>;
export const graphics: Graphics = {
  circle: ({ g, entity }) => {
    const { position, asteroidSpawn } = entity.requireComponents([
      "asteroidSpawn",
      "position",
    ]).cp;
    g.lineStyle({
      alpha: 0.3,
      width: 1,
      color: Color(fieldColors[asteroidSpawn!.type]).rgbNumber(),
    });
    g.drawCircle(
      position!.coord.get([0]) * 10,
      position!.coord.get([1]) * 10,
      asteroidSpawn!.size * 10
    );
  },
  sector: ({ g, entity }) => {
    const { name, hecsPosition } = entity.requireComponents([
      "name",
      "hecsPosition",
    ]).cp;
    const pos = hecsToCartesian(hecsPosition.value, sectorSize);
    g.lineStyle({ color: 0x292929, width: 5 });
    g.drawRegularPolygon!(
      pos.get([0]),
      pos.get([1]),
      sectorSize,
      6,
      Math.PI / 6
    );
    const textGraphics = new PIXI.Text(name.value, {
      fill: 0x404040,
      fontFamily: "Space Mono",
    });
    textGraphics.resolution = 8;
    const textPos = add(pos, matrix([0, 90 - sectorSize])) as Matrix;
    textGraphics.anchor.set(0.5, 0.5);
    textGraphics.position.set(textPos.get([0]), textPos.get([1]));
    textGraphics.interactive = true;
    textGraphics.on("mousedown", () => {
      entity.sim.queries.selectionManager.get()[0].cp.selectionManager.id =
        entity.id;
    });
    textGraphics.cursor = "pointer";
    g.addChild(textGraphics);
  },
};

export interface RenderGraphics<T extends keyof Graphics>
  extends BaseComponent<"renderGraphics"> {
  draw: T;
  g: PIXI.Graphics;
  initialized: boolean;
}

export function createRenderGraphics<T extends keyof Graphics>(
  draw: T
): RenderGraphics<T> {
  return {
    draw,
    initialized: false,
    g: new PIXI.Graphics(),
    name: "renderGraphics",
  };
}

export function drawGraphics(
  entity: RequireComponent<"renderGraphics">,
  container: PIXI.Container
) {
  if (!entity.cp.renderGraphics.initialized) {
    container.addChild(entity.cp.renderGraphics.g);
    entity.cp.renderGraphics.initialized = true;
  } else {
    entity.cp.renderGraphics.g.children.forEach((c) => c.destroy());
    entity.cp.renderGraphics.g.clear();
  }
  graphics[entity.cp.renderGraphics.draw]({
    g: entity.cp.renderGraphics.g,
    entity,
  });
}