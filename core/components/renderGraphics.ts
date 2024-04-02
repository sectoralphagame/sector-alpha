import { fieldColors } from "@core/archetypes/asteroid";
import Color from "color";
import { add } from "mathjs";
import type { Viewport } from "pixi-viewport";
import * as PIXI from "pixi.js";
import { spottingRadius } from "@core/systems/ai/spotting";
import { first } from "@fxts/core";
import { FogOfWarUpdatingSystem } from "@core/systems/fogOfWarUpdating";
import type { Sector } from "../archetypes/sector";
import { sectorSize } from "../archetypes/sector";
import { findInAncestors } from "../utils/findInAncestors";
import type { BaseComponent } from "./component";
import type { Entity } from "../entity";
import { hecsToCartesian } from "./hecsPosition";
import type { Position2D } from "./position";

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

  g.zIndex = 1;
  const { orders } = entity.requireComponents(["orders"]).cp;
  const origin = findInAncestors(entity, "position");
  const originPosition: Position2D = add(
    origin.cp.position.coord,
    hecsToCartesian(
      entity.sim.getOrThrow<Sector>(origin.cp.position.sector).cp.hecsPosition
        .value,
      sectorSize / 10
    )
  );

  g.moveTo(originPosition[0] * 10, originPosition[1] * 10);

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

        const targetWithPosition = findInAncestors(target!, "position");
        const targetPosition = add(
          targetWithPosition.cp.position.coord,
          hecsToCartesian(
            entity.sim.getOrThrow<Sector>(targetWithPosition.cp.position.sector)
              .cp.hecsPosition.value,
            sectorSize / 10
          )
        );

        if (action.type === "teleport") {
          g.moveTo(targetPosition[0] * 10, targetPosition[1] * 10);
        } else {
          g.lineStyle({
            alpha: 0.3,
            width: 3 / viewport.scale.x,
            color: Color.hsl(0, 0, 70).rgbNumber(),
          });
          g.lineTo(targetPosition[0] * 10, targetPosition[1] * 10);
          g.drawCircle(
            targetPosition[0] * 10,
            targetPosition[1] * 10,
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
  | "hexGrid"
  | "fogOfWarGrid",
  // eslint-disable-next-line no-unused-vars
  (opts: { g: PIXI.Graphics; entity: Entity; viewport: Viewport }) => void
>;
export const graphics: Graphics = {
  asteroidField: ({ g, entity }) => {
    g.zIndex = 1;
    const { position: posInSector, asteroidSpawn } = entity.requireComponents([
      "asteroidSpawn",
      "position",
    ]).cp;
    const position: Position2D = add(
      posInSector.coord,
      hecsToCartesian(
        entity.sim.getOrThrow<Sector>(posInSector.sector).cp.hecsPosition.value,
        sectorSize / 10
      )
    );
    g.lineStyle({
      alpha: 0.3,
      width: 1,
      color: Color(fieldColors[asteroidSpawn!.type]).rgbNumber(),
    })
      .drawCircle(position[0] * 10, position[1] * 10, asteroidSpawn!.size * 10)
      .lineStyle({
        alpha: 0.2,
        width: 0.8,
        color: Color(fieldColors[asteroidSpawn!.type]).rgbNumber(),
      })
      .drawCircle(
        position[0] * 10,
        position[1] * 10,
        asteroidSpawn!.size * 10 - 2
      )
      .lineStyle({
        alpha: 0.1,
        width: 0.6,
        color: Color(fieldColors[asteroidSpawn!.type]).rgbNumber(),
      })
      .drawCircle(
        position[0] * 10,
        position[1] * 10,
        asteroidSpawn!.size * 10 - 4
      );
  },
  link: ({ g, entity }) => {
    g.zIndex = 1;
    const { teleport } = entity.requireComponents(["teleport"]).cp;
    const origin = findInAncestors(entity, "position");
    const originPosition: Position2D = add(
      origin.cp.position.coord,
      hecsToCartesian(
        entity.sim.getOrThrow<Sector>(origin.cp.position.sector).cp.hecsPosition
          .value,
        sectorSize / 10
      )
    );
    const target = findInAncestors(
      entity.sim.getOrThrow(teleport.destinationId!),
      "position"
    );
    const targetPosition: Position2D = add(
      target.cp.position.coord,
      hecsToCartesian(
        entity.sim.getOrThrow<Sector>(target.cp.position.sector).cp.hecsPosition
          .value,
        sectorSize / 10
      )
    );
    const targetTeleport = entity.sim
      .getOrThrow(teleport.destinationId!)
      .requireComponents(["teleport"]).cp.teleport;
    g.lineStyle({
      alpha: 0.3,
      width: 5,
      color: Color.hsl(0, 0, 70).rgbNumber(),
    });
    g.moveTo(originPosition[0] * 10, originPosition[1] * 10);
    if (teleport.draw) {
      g.bezierCurveTo(
        ...((teleport.draw === "horizontal"
          ? [
              (originPosition[0] + targetPosition[0]) * 5,
              originPosition[1] * 10,
            ]
          : [
              originPosition[0] * 10,
              (targetPosition[1] + originPosition[1]) * 5,
            ]) as [number, number]),
        ...((targetTeleport.draw === "horizontal"
          ? [
              (originPosition[0] + targetPosition[0]) * 5,
              targetPosition[1] * 10,
            ]
          : [
              targetPosition[0] * 10,
              (targetPosition[1] + originPosition[1]) * 5,
            ]) as [number, number]),
        targetPosition[0] * 10,
        targetPosition[1] * 10
      );
    } else if (
      Math.abs(targetPosition[0] - originPosition[0]) >
      Math.abs(targetPosition[1] - originPosition[1])
    ) {
      g.bezierCurveTo(
        (originPosition[0] + targetPosition[0]) * 5,
        originPosition[1] * 10,
        (originPosition[0] + targetPosition[0]) * 5,
        targetPosition[1] * 10,
        targetPosition[0] * 10,
        targetPosition[1] * 10
      );
    } else {
      g.bezierCurveTo(
        originPosition[0] * 10,
        (targetPosition[1] + originPosition[1]) * 5,
        targetPosition[0] * 10,
        (targetPosition[1] + originPosition[1]) * 5,
        targetPosition[0] * 10,
        targetPosition[1] * 10
      );
    }
  },
  path,
  pathWithRange: ({ g, entity, viewport }) => {
    path({ g, entity, viewport });
    if (entity.cp.damage) {
      const entityPos = add(
        hecsToCartesian(
          entity.sim.getOrThrow<Sector>(entity.cp.position!.sector).cp
            .hecsPosition.value,
          sectorSize / 10
        ),
        entity.cp.position!.coord
      );
      g.lineStyle({
        width: 0.3,
        color: 0xff0000,
      })
        .drawCircle(
          entityPos[0] * 10,
          entityPos[1] * 10,
          entity.cp.damage.range * 10
        )
        .lineStyle({
          width: 0.2,
          color: 0x0000ff,
        })
        .drawCircle(entityPos[0] * 10, entityPos[1] * 10, spottingRadius * 10);
    }
  },
  waypoint: ({ g, entity }) => {
    g.zIndex = 1;

    const { position } = entity.requireComponents(["position"]).cp;
    g.lineStyle({
      alpha: 0.3,
      width: 1,
      color: 0xffffff,
    }).drawCircle(0, 0, 1);
    g.position.set(position!.coord[0] * 10, position!.coord[1] * 10);
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
    g.beginFill(0x202020);
    g.drawRegularPolygon!(0, 0, sectorSize - 2.5, 6, Math.PI / 6).endFill();
    const textGraphics = new PIXI.Text(name.value, {
      fill: 0x404040,
      fontFamily: "Space Mono",
    });
    textGraphics.resolution = 7;
    const textPos = [0, 90 - sectorSize];
    textGraphics.anchor.set(0.5, 0.5);
    textGraphics.position.set(textPos[0], textPos[1]);
    textGraphics.interactive = true;
    textGraphics.on("pointerdown", () => {
      first(entity.sim.queries.settings.getIt())!.cp.selectionManager.id =
        entity.id;
    });
    textGraphics.cursor = "pointer";
    g.position.set(pos[0], pos[1]);
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
  fogOfWarGrid: ({ g, entity }) => {
    g.lineStyle({
      color: 0x323232,
      width: 0.25,
    });

    const sectorMaps = FogOfWarUpdatingSystem.getMaps();
    const divisions = FogOfWarUpdatingSystem.getDivisions();
    const chunkSize = (sectorSize / divisions) * 2;

    for (const sector of entity.sim.queries.sectors.get()) {
      const pos = hecsToCartesian(sector.cp.hecsPosition.value, sectorSize);

      for (let x = 0; x <= divisions; x += 1) {
        for (let y = 0; y <= divisions; y += 1) {
          if (sectorMaps[sector.id]?.[y * divisions + x]) {
            g.beginFill(0x000000)
              .drawRect(
                pos[0] + chunkSize * (x - divisions / 2),
                pos[1] + chunkSize * (y - divisions / 2),
                (sectorSize / divisions) * 2,
                (sectorSize / divisions) * 2
              )
              .endFill();
          }
        }
      }

      for (let x = -sectorSize + chunkSize; x <= sectorSize; x += chunkSize) {
        let h = 0;
        if (x <= -sectorSize / 2) {
          h = Math.tan(Math.PI / 3) * (x + sectorSize) - 10;
        } else if (x > -sectorSize / 2 && x <= sectorSize / 2) {
          h = (sectorSize * Math.sqrt(3)) / 2 - 5;
        } else if (x > sectorSize / 2) {
          h = Math.tan(Math.PI / 3) * (sectorSize - x) - 10;
        }
        g.moveTo(pos[0] + x, pos[1] - h);
        g.lineTo(pos[0] + x, pos[1] + h);
      }
      for (let y = -sectorSize; y <= sectorSize; y += chunkSize) {
        if (
          y > (-sectorSize * Math.sqrt(3)) / 2 &&
          y < (sectorSize * Math.sqrt(3)) / 2
        ) {
          let h = 0;
          if (y <= 0) {
            h = Math.tan(Math.PI / 6) * (y + sectorSize) - 45 + sectorSize / 2;
          } else {
            h = Math.tan(Math.PI / 6) * (sectorSize - y) - 45 + sectorSize / 2;
          }
          g.moveTo(pos[0] - h, pos[1] + y);
          g.lineTo(pos[0] + h, pos[1] + y);
        }
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
    redraw: false,
    realTime: ["path", "pathWithRange"].includes(draw),
    name: "renderGraphics",
  };
}
