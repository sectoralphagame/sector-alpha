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
import { createFaction } from "@core/archetypes/faction";
import Color from "color";
import { createShip } from "@core/archetypes/ship";
import { shipClasses } from "@core/world/ships";
import { random } from "mathjs";
import { pickRandom } from "@core/utils/generators";
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
import { createFacility } from "@core/archetypes/facility";
import { addFacilityModule } from "@core/utils/entityModules";
import { facilityModules } from "@core/archetypes/facilityModule";

export const StationUnderAttack = () => {
  const [params] = useSearchParams();
  const [sim, setSim] = React.useState<Sim | null>(null);
  const engine = React.useMemo(() => {
    const e = new Engine3D<TacticalMapScene>();
    e.hooks.onInit.subscribe("StationUnderAttack", () => {
      const asteroids = new Asteroids(
        window.renderer,
        10,
        1,
        [[new Vec2(0, 0), 10]] as const,
        ["ice"]
      );
      asteroids.setParent(window.renderer.scene);
    });
    return e;
  }, []);

  const fighters = Number(params.get("fighters") ?? 5);

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

    const stationFaction = createFaction("Station Faction", xSim);
    const fightersFaction = createFaction("Fighters Faction", xSim);
    stationFaction.cp.color.value = Color.hsv(0, 100, 100).rgb().string();
    fightersFaction.cp.color.value = Color.hsv(120, 100, 100).rgb().string();
    changeRelations(
      stationFaction,
      fightersFaction,
      relationThresholds.attack - 1
    );

    const station = createFacility(xSim, {
      owner: stationFaction,
      sector,
      position: new Vec2(0, 0),
    });
    addFacilityModule(
      station,
      facilityModules.smallDefense.create(xSim, station)
    );

    for (let j = 0; j < fighters; j++) {
      const fighter = createShip(xSim, {
        ...pickRandom(shipClasses.filter(({ slug }) => slug === "dart")),
        angle: random(-Math.PI, Math.PI),
        position: fromPolar((2 * Math.PI * j) / fighters, random(1, 2)),
        owner: fightersFaction,
        sector,
      });
      fighter.cp.orders.value = [
        {
          type: "attack",
          actions: [],
          origin: "manual",
          followOutsideSector: false,
          ordersForSector: sector.id,
          targetId: station.id,
        },
      ];
    }

    xSim.start();
    setSim(xSim);

    return () => {
      xSim.destroy();
    };
  }, [fighters]);

  if (!sim) return null;

  return <TacticalMap sim={sim} engine={engine} />;
};
