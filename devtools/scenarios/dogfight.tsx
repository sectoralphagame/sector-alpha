import React from "react";
import { Sim } from "@core/sim";
import { movingSystem } from "@core/systems/moving";
import { spottingSystem } from "@core/systems/ai/spotting";
import { hitpointsRegeneratingSystem } from "@core/systems/hitpointsRegenerating";
import { cooldownUpdatingSystem } from "@core/systems/cooldowns";
import { orderPlanningSystem } from "@core/systems/ai/orderPlanning";
import { orderExecutingSystem } from "@core/systems/orderExecuting/orderExecuting";
import { attackingSystem } from "@core/systems/attacking";
import { deadUnregisteringSystem } from "@core/systems/deadUnregistering";
import { pathPlanningSystem } from "@core/systems/pathPlanning";
import { createSector } from "@core/archetypes/sector";
import type { Faction } from "@core/archetypes/faction";
import { createFaction } from "@core/archetypes/faction";
import Color from "color";
import { createShip } from "@core/archetypes/ship";
import { shipClasses } from "@core/world/ships";
import { random } from "mathjs";
import { pickRandom } from "@core/utils/generators";
import { moveToActions } from "@core/utils/moving";
import { createWaypoint } from "@core/archetypes/waypoint";
import { fromPolar } from "@core/utils/misc";
import {
  changeRelations,
  relationThresholds,
} from "@core/components/relations";
import settings from "@core/settings";
import { TacticalMap } from "@ui/components/TacticalMap/TacticalMap";
import { gameStore } from "@ui/state/game";
import { Vec2 } from "ogl";
import { NavigatingSystem } from "@core/systems/navigating";
import { useSearchParams } from "react-router-dom";
import { Asteroids } from "@ogl-engine/builders/Asteroids";
import { Engine3D } from "@ogl-engine/engine/engine3d";
import type { TacticalMapScene } from "@ogl-engine/engine/Scene";

export const Dogfight = () => {
  const [params] = useSearchParams();
  const [sim, setSim] = React.useState<Sim | null>(null);
  const engine = React.useMemo(() => {
    const e = new Engine3D<TacticalMapScene>();
    e.hooks.onInit.subscribe("Dogfight", () => {
      const asteroids = new Asteroids(
        window.renderer,
        10,
        0.1,
        [[new Vec2(0, 0), 10]] as const,
        ["ice"]
      );
      asteroids.setParent(window.renderer.scene);
    });
    return e;
  }, []);

  const factions = Number(params.get("factions") ?? 4);
  const fighters = Number(params.get("fighters") ?? 2);

  React.useEffect(() => {
    settings.bootTime = 0;
    const xSim = new Sim({
      systems: [
        pathPlanningSystem,
        movingSystem,
        spottingSystem,
        hitpointsRegeneratingSystem,
        new NavigatingSystem(),
        cooldownUpdatingSystem,
        orderPlanningSystem,
        orderExecutingSystem,
        attackingSystem,
        deadUnregisteringSystem,
      ],
    });
    xSim.init();

    document.addEventListener("keydown", (e) => {
      if (e.key === " ") {
        if (xSim.speed > 0) {
          xSim.pause();
        } else {
          xSim.setSpeed(xSim.prevSpeed);
        }
      }
    });

    const sector = createSector(xSim, {
      position: [0, 0, 0],
      name: "Sector",
      slug: "sector",
    });
    gameStore.setSector(sector);

    const generatedFactions: Faction[] = [];
    for (let i = 0; i < factions; i++) {
      const faction = createFaction(`Faction #${i + 1}`, xSim);
      faction.cp.color.value = Color.hsv((i / factions) * 360, 100, 100)
        .rgb()
        .string();
      faction.cp.policies.enemySpotted.military = "attack";
      generatedFactions.push(faction);

      for (let j = 0; j < fighters; j++) {
        const fighter = createShip(xSim, {
          ...pickRandom(shipClasses.filter(({ slug }) => slug === "dart")),
          angle: random(-Math.PI, Math.PI),
          position: fromPolar(
            (2 * Math.PI * (i * fighters + j)) / (factions * fighters),
            random(4, 6)
          ),
          owner: faction,
          sector,
        });
        const t = random(0.75, 1);
        fighter.cp.drive.cruise *= t;
        fighter.cp.drive.maneuver /= t;
        fighter.cp.orders.value = [
          {
            type: "move",
            actions: moveToActions(
              fighter,
              createWaypoint(xSim, {
                value: new Vec2(0, 0),
                sector: sector.id,
                owner: faction.id,
              }),
              {}
            ),
            origin: "manual",
          },
        ];
      }
    }
    for (const factionA of generatedFactions) {
      for (const factionB of generatedFactions) {
        if (factionA === factionB) continue;
        changeRelations(factionA, factionB, relationThresholds.attack - 1);
      }
    }

    xSim.start();
    setSim(xSim);

    return () => {
      xSim.destroy();
    };
  }, [factions, fighters]);

  if (!sim) return null;

  return <TacticalMap sim={sim} engine={engine} />;
};
