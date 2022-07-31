import Color from "color";
import { add, matrix, Matrix } from "mathjs";
import * as PIXI from "pixi.js";
import { sectorSize } from "../archetypes/sector";
import { theme } from "../style";
import { RequireComponent } from "../tsHelpers";
import { findInAncestors } from "../utils/findInAncestors";
import { BaseComponent } from "./component";
import { Entity } from "./entity";
import { hecsToCartesian } from "./hecsPosition";

export type Graphics = Record<
  "circle" | "link" | "marker" | "sector",
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
      color: Color(theme.palette.asteroids[asteroidSpawn!.type]).rgbNumber(),
    });
    g.drawCircle(
      position!.coord.get([0]) * 10,
      position!.coord.get([1]) * 10,
      asteroidSpawn!.size * 10
    );
  },
  link: ({ g, entity }) => {
    const { teleport } = entity.requireComponents(["teleport"]).cp;
    const originPosition = findInAncestors(entity, "position").cp.position;
    const targetPosition = findInAncestors(
      entity.sim.getOrThrow(teleport.destinationId!),
      "position"
    ).cp.position;
    g.lineStyle({
      alpha: 0.3,
      width: 5,
      color: Color(theme.palette.disabled).rgbNumber(),
    });
    g.moveTo(
      originPosition!.coord.get([0]) * 10,
      originPosition!.coord.get([1]) * 10
    );
    if (
      Math.abs(
        targetPosition!.coord.get([0]) - originPosition!.coord.get([0])
      ) >
      Math.abs(targetPosition!.coord.get([1]) - originPosition!.coord.get([1]))
    ) {
      g.bezierCurveTo(
        (originPosition!.coord.get([0]) + targetPosition!.coord.get([0])) * 5,
        originPosition!.coord.get([1]) * 10,
        (originPosition!.coord.get([0]) + targetPosition!.coord.get([0])) * 5,
        targetPosition!.coord.get([1]) * 10,
        targetPosition!.coord.get([0]) * 10,
        targetPosition!.coord.get([1]) * 10
      );
    } else {
      g.bezierCurveTo(
        originPosition!.coord.get([0]) * 10,
        (targetPosition!.coord.get([1]) + originPosition!.coord.get([1])) * 5,
        targetPosition!.coord.get([0]) * 10,
        (targetPosition!.coord.get([1]) + originPosition!.coord.get([1])) * 5,
        targetPosition!.coord.get([0]) * 10,
        targetPosition!.coord.get([1]) * 10
      );
    }
  },
  marker: ({ g, entity }) => {
    const { position } = entity.requireComponents(["position"]).cp;
    g.lineStyle({
      alpha: 0.3,
      width: 1,
      color: 0xffffff,
    });
    g.drawCircle(
      position!.coord.get([0]) * 10,
      position!.coord.get([1]) * 10,
      1
    );
  },
  sector: ({ g, entity }) => {
    const { name, hecsPosition } = entity.requireComponents([
      "name",
      "hecsPosition",
    ]).cp;
    const pos = hecsToCartesian(hecsPosition.value, sectorSize);
    g.lineStyle({
      color: entity.cp.owner?.id
        ? Color(
            entity.sim.getOrThrow(entity.cp.owner.id).cp.color?.value
          ).rgbNumber()
        : 0x292929,
      width: 5,
    });
    g.drawRegularPolygon!(
      pos.get([0]),
      pos.get([1]),
      sectorSize - 3,
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
    textGraphics.on("pointerdown", () => {
      entity.sim.queries.settings.get()[0].cp.selectionManager.id = entity.id;
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
