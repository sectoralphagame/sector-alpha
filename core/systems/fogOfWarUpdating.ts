import type { Sim } from "@core/sim";
import { Entity } from "@core/entity";
import { createRenderGraphics } from "@core/components/renderGraphics";
import type { RequireComponent } from "@core/tsHelpers";
import { sectorSize } from "@core/archetypes/sector";
import type { Position2D } from "@core/components/position";
import { System } from "./system";
import { Index } from "./utils/entityIndex";

let sectorMaps: Record<number, Uint8Array> = {};
const divisions = 2 ** 6;

export class FogOfWarUpdatingSystem extends System<"exec"> {
  grid: RequireComponent<"renderGraphics"> | null = null;
  entitiesWithInfluence: Index<"position" | "owner">;
  entitiesToHide: Index<"position" | "render">;
  enabled = true;

  apply = (sim: Sim): void => {
    super.apply(sim);

    this.grid =
      sim
        .find(
          (e) =>
            e.tags.has("virtual") &&
            e.cp.renderGraphics?.draw === "fogOfWarGrid"
        )
        ?.requireComponents(["renderGraphics"]) ?? null;

    if (!this.grid) {
      this.initGrid();
    }

    sim.actions.register(
      {
        category: "drawing",
        type: "basic",
        description: "Show fog of war grid",
        name: "Fog of war grid",
        slug: "fogOfWarGrid",
        // eslint-disable-next-line no-shadow
        fn: (sim) => {
          if (this.grid) {
            sim.unregisterEntity(this.grid);
            this.grid = null;
          } else {
            this.initGrid();
          }
        },
      },
      this.constructor.name
    );

    sim.actions.register(
      {
        category: "core",
        type: "basic",
        description: "Toggle fog of war",
        name: "Fog of war",
        fn: () => {
          this.enabled = !this.enabled;
        },
        slug: "fogOfWar",
      },
      this.constructor.name
    );

    this.entitiesWithInfluence = new Index(sim, ["position", "owner"]);
    this.entitiesToHide = new Index(sim, ["position", "render"]);

    sim.hooks.phase.init.subscribe(this.constructor.name, this.updateFog);
  };

  initGrid = () => {
    const grid = new Entity(this.sim);

    this.grid = grid
      .addTag("virtual")
      .addComponent(createRenderGraphics("fogOfWarGrid"))
      .requireComponents(["renderGraphics"]);
  };

  updateFog = () => {
    this.cooldowns.doEvery("exec", 0.3, () => {
      sectorMaps = {};

      const player = this.sim.queries.player.get()[0];

      for (const entity of this.entitiesWithInfluence.getIt()) {
        const position = entity.cp.position;
        const owner = entity.cp.owner;
        if (owner.id !== player.id) continue;

        const sectorId = position.sector;
        if (!sectorMaps[sectorId]) {
          sectorMaps[sectorId] = new Uint8Array(divisions ** 2);
        }

        const [x, y] = FogOfWarUpdatingSystem.getBox(position.coord);

        const r = entity.tags.has("facility") ? 7 : 4;

        for (let i = -r; i <= r; i++) {
          for (let j = -r; j <= r; j++) {
            if (i ** 2 + j ** 2 > r ** 2) continue;
            sectorMaps[sectorId][(y + i) * divisions + x + j] = 1;
          }
        }
      }

      for (const entity of this.entitiesToHide.getIt()) {
        if (entity.cp.dockable?.dockedIn) continue;

        if (!this.enabled) {
          entity.cp.render!.visible = true;
        } else {
          const [x, y] = FogOfWarUpdatingSystem.getBox(
            entity.cp.position.coord
          );

          if (entity.cp.owner?.id !== player.id) {
            entity.cp.render!.visible =
              !!sectorMaps[entity.cp.position.sector]?.[y * divisions + x] ||
              entity.tags.has("discovered");
            if (
              entity.cp.render!.visible &&
              (entity.tags.has("facility") || entity.tags.has("collectible"))
            ) {
              entity.addTag("discovered");
            }
          }
        }
      }

      if (this.grid) {
        this.grid.cp.renderGraphics.redraw = true;
      }
    });
  };

  static getBox = (pos: Position2D): [number, number] => [
    Math.floor((pos[0] * divisions) / 2 / (sectorSize / 10) + divisions / 2),
    Math.floor((pos[1] * divisions) / 2 / (sectorSize / 10) + divisions / 2),
  ];

  static getMaps = () => sectorMaps;

  static getDivisions = () => divisions;
}
