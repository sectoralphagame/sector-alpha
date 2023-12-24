import { fieldColors } from "@core/archetypes/asteroid";
import Color from "color";
import { add } from "mathjs";
import type { Viewport } from "pixi-viewport";
import * as PIXI from "pixi.js";
import { spottingRadius } from "@core/systems/ai/spotting";
import { first } from "@fxts/core";
import { sectorSize } from "../archetypes/sector";
import { findInAncestors } from "../utils/findInAncestors";
import type { BaseComponent } from "./component";
import type { Entity } from "../entity";
import { hecsToCartesian } from "./hecsPosition";

const path = ({
  g,
  entity,
  viewport,
}: {
  g: PIXI.Graphics;
  entity: Entity;
  viewport: Viewport;
}) => {
  if (!entity.hasComponents(["orders"])) return;

  const { orders } = entity.requireComponents(["orders"]).cp;
  const originPosition = findInAncestors(entity, "position").cp.position;

  g.moveTo(originPosition!.coord[0] * 10, originPosition!.coord[1] * 10);

  orders.value.forEach((order) =>
    order.actions.forEach((action) => {
      if (
        action.type === "dock" ||
        action.type === "teleport" ||
        action.type === "move" ||
        action.type === "attack"
      ) {
        const target = entity.sim.get(action.targetId);
        if (!target) return;

        const targetPosition = findInAncestors(target!, "position").cp.position;

        if (action.type === "teleport") {
          g.moveTo(
            targetPosition!.coord[0] * 10,
            targetPosition!.coord[1] * 10
          );
        } else {
          g.lineStyle({
            alpha: 0.3,
            width: 3 / viewport.scale.x,
            color: Color.hsl(0, 0, 70).rgbNumber(),
          });
          g.lineTo(
            targetPosition!.coord[0] * 10,
            targetPosition!.coord[1] * 10
          );
          g.drawCircle(
            targetPosition!.coord[0] * 10,
            targetPosition!.coord[1] * 10,
            3 / viewport.scale.x
          );
        }
      }
    })
  );
};

export type Graphics = Record<
  | "asteroidField"
  | "link"
  | "waypoint"
  | "sector"
  | "path"
  | "pathWithRange"
  | "hexGrid",
  // eslint-disable-next-line no-unused-vars
  (opts: { g: PIXI.Graphics; entity: Entity; viewport: Viewport }) => void
>;
export const graphics: Graphics = {
  asteroidField: ({ g, entity }) => {
    const { position, asteroidSpawn } = entity.requireComponents([
      "asteroidSpawn",
      "position",
    ]).cp;
    g.lineStyle({
      alpha: 0.3,
      width: 1,
      color: Color(fieldColors[asteroidSpawn!.type]).rgbNumber(),
    })
      .drawCircle(
        position!.coord[0] * 10,
        position!.coord[1] * 10,
        asteroidSpawn!.size * 10
      )
      .lineStyle({
        alpha: 0.2,
        width: 0.8,
        color: Color(fieldColors[asteroidSpawn!.type]).rgbNumber(),
      })
      .drawCircle(
        position!.coord[0] * 10,
        position!.coord[1] * 10,
        asteroidSpawn!.size * 10 - 2
      )
      .lineStyle({
        alpha: 0.1,
        width: 0.6,
        color: Color(fieldColors[asteroidSpawn!.type]).rgbNumber(),
      })
      .drawCircle(
        position!.coord[0] * 10,
        position!.coord[1] * 10,
        asteroidSpawn!.size * 10 - 4
      );
  },
  link: ({ g, entity }) => {
    const { teleport } = entity.requireComponents(["teleport"]).cp;
    const originPosition = findInAncestors(entity, "position").cp.position;
    const targetPosition = findInAncestors(
      entity.sim.getOrThrow(teleport.destinationId!),
      "position"
    ).cp.position;
    const targetTeleport = entity.sim
      .getOrThrow(teleport.destinationId!)
      .requireComponents(["teleport"]).cp.teleport;
    g.lineStyle({
      alpha: 0.3,
      width: 5,
      color: Color.hsl(0, 0, 70).rgbNumber(),
    });
    g.moveTo(originPosition!.coord[0] * 10, originPosition!.coord[1] * 10);
    if (teleport.draw) {
      g.bezierCurveTo(
        ...((teleport.draw === "horizontal"
          ? [
              (originPosition!.coord[0] + targetPosition!.coord[0]) * 5,
              originPosition!.coord[1] * 10,
            ]
          : [
              originPosition!.coord[0] * 10,
              (targetPosition!.coord[1] + originPosition!.coord[1]) * 5,
            ]) as [number, number]),
        ...((targetTeleport.draw === "horizontal"
          ? [
              (originPosition!.coord[0] + targetPosition!.coord[0]) * 5,
              targetPosition!.coord[1] * 10,
            ]
          : [
              targetPosition!.coord[0] * 10,
              (targetPosition!.coord[1] + originPosition!.coord[1]) * 5,
            ]) as [number, number]),
        targetPosition!.coord[0] * 10,
        targetPosition!.coord[1] * 10
      );
    } else if (
      Math.abs(targetPosition!.coord[0] - originPosition!.coord[0]) >
      Math.abs(targetPosition!.coord[1] - originPosition!.coord[1])
    ) {
      g.bezierCurveTo(
        (originPosition!.coord[0] + targetPosition!.coord[0]) * 5,
        originPosition!.coord[1] * 10,
        (originPosition!.coord[0] + targetPosition!.coord[0]) * 5,
        targetPosition!.coord[1] * 10,
        targetPosition!.coord[0] * 10,
        targetPosition!.coord[1] * 10
      );
    } else {
      g.bezierCurveTo(
        originPosition!.coord[0] * 10,
        (targetPosition!.coord[1] + originPosition!.coord[1]) * 5,
        targetPosition!.coord[0] * 10,
        (targetPosition!.coord[1] + originPosition!.coord[1]) * 5,
        targetPosition!.coord[0] * 10,
        targetPosition!.coord[1] * 10
      );
    }
  },
  path,
  pathWithRange: ({ g, entity, viewport }) => {
    path({ g, entity, viewport });
    if (entity.cp.damage) {
      g.lineStyle({
        width: 0.3,
        color: 0xff0000,
      })
        .drawCircle(
          entity.cp.position!.coord[0] * 10,
          entity.cp.position!.coord[1] * 10,
          entity.cp.damage.range * 10
        )
        .lineStyle({
          width: 0.2,
          color: 0x0000ff,
        })
        .drawCircle(
          entity.cp.position!.coord[0] * 10,
          entity.cp.position!.coord[1] * 10,
          spottingRadius * 10
        );
    }
  },
  waypoint: ({ g, entity }) => {
    const { position } = entity.requireComponents(["position"]).cp;
    g.lineStyle({
      alpha: 0.3,
      width: 1,
      color: 0xffffff,
    }).drawCircle(position!.coord[0] * 10, position!.coord[1] * 10, 1);
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
        : 0x3a3a3a,
      width: 5,
    });
    g.drawRegularPolygon!(pos[0], pos[1], sectorSize - 2.5, 6, Math.PI / 6);
    const textGraphics = new PIXI.Text(name.value, {
      fill: 0x404040,
      fontFamily: "Space Mono",
    });
    textGraphics.resolution = 7;
    const textPos = add(pos, [0, 90 - sectorSize]);
    textGraphics.anchor.set(0.5, 0.5);
    textGraphics.position.set(textPos[0], textPos[1]);
    textGraphics.interactive = true;
    textGraphics.on("pointerdown", () => {
      first(entity.sim.queries.settings.getIt())!.cp.selectionManager.id =
        entity.id;
    });
    textGraphics.cursor = "pointer";
    g.addChild(textGraphics);
  },
  hexGrid: ({ g }) => {
    for (let q = -10; q < 11; q++) {
      for (let r = -10; r < 11; r++) {
        const sectorPos = hecsToCartesian([q, r, -q - r], sectorSize);

        const coordG = new PIXI.Text([q, r].join(","), {
          fill: 0x404040,
          fontFamily: "Space Mono",
        });
        coordG.resolution = 8;
        const coordPos = add(sectorPos, [sectorSize / 3, (sectorSize * 3) / 4]);
        coordG.anchor.set(0.5, 0.5);
        coordG.position.set(coordPos[0], coordPos[1]);
        g.addChild(coordG);

        g.lineStyle({
          color: 0x323232,
          width: 1,
        });
        g.drawRegularPolygon!(
          sectorPos[0],
          sectorPos[1],
          sectorSize - 2.5,
          6,
          Math.PI / 6
        );
      }
    }
  },
};

export interface RenderGraphics<T extends keyof Graphics>
  extends BaseComponent<"renderGraphics"> {
  draw: T;
  redraw: boolean;
  realTime: boolean;
}

export function createRenderGraphics<T extends keyof Graphics>(
  draw: T
): RenderGraphics<T> {
  return {
    draw,
    redraw: ["path", "pathWithRange"].includes(draw),
    realTime: ["path", "pathWithRange"].includes(draw),
    name: "renderGraphics",
  };
}
