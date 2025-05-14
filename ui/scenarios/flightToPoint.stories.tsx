import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { Sim } from "@core/sim";
import { movingSystem } from "@core/systems/moving";
import { cooldownUpdatingSystem } from "@core/systems/cooldowns";
import { orderPlanningSystem } from "@core/systems/ai/orderPlanning";
import { orderExecutingSystem } from "@core/systems/orderExecuting/orderExecuting";
import { deadUnregisteringSystem } from "@core/systems/deadUnregistering";
import { pathPlanningSystem } from "@core/systems/pathPlanning";
import { createSector } from "@core/archetypes/sector";
import { createFaction } from "@core/archetypes/faction";
import Color from "color";
import { createShip } from "@core/archetypes/ship";
import { shipClasses } from "@core/world/ships";
import { pickRandom } from "@core/utils/generators";
import { moveToActions } from "@core/utils/moving";
import { createWaypoint } from "@core/archetypes/waypoint";
import { fromPolar } from "@core/utils/misc";
import settings from "@core/settings";
import { TacticalMap } from "@ui/components/TacticalMap/TacticalMap";
import { gameStore } from "@ui/state/game";
import { Vec2 } from "ogl";
import { NavigatingSystem } from "@core/systems/navigating";

const Game: React.FC<{ factions: number; fighters: number }> = ({
  factions,
  fighters,
}) => {
  const [sim, setSim] = React.useState<Sim | null>(null);
  React.useEffect(() => {
    settings.bootTime = 0;
    const xSim = new Sim({
      systems: [
        pathPlanningSystem,
        movingSystem,
        new NavigatingSystem(),
        cooldownUpdatingSystem,
        orderPlanningSystem,
        orderExecutingSystem,
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

    const faction = createFaction("Faction", xSim);
    faction.cp.color.value = Color.hsv(50, 100, 100).rgb().string();

    const fighter = createShip(xSim, {
      ...pickRandom(shipClasses.filter(({ slug }) => slug === "dart")),
      angle: 0,
      position: new Vec2(),
      owner: faction,
      sector,
    });

    const n = 4;
    const checkpoints: number[] = [];
    for (let i = 0; i < 2 * n; i++) {
      const waypoint = createWaypoint(xSim, {
        value: fromPolar((i * Math.PI) / n, 1),
        owner: fighter.id,
        sector: sector.id,
      });
      waypoint.addComponent({
        name: "render",
        color: 0,
        defaultScale: 20,
        hidden: 0,
        interactive: false,
        layer: "ship",
        model: "world/asteroid1",
        static: true,
        texture: "asteroid",
      });
      checkpoints.push(waypoint.id);
    }

    for (let i = 0; i < 2 * n; i++) {
      fighter.cp.orders.value.push({
        type: "move",
        actions: moveToActions(
          fighter,
          xSim.getOrThrow(checkpoints[(i + (i % 2 ? 0 : n)) % (2 * n)])
        ),
        origin: "story",
      });
    }

    xSim.start();
    setSim(xSim);

    return () => {
      xSim.destroy();
    };
  }, [factions, fighters]);

  if (!sim) return null;

  return <TacticalMap sim={sim} />;
};

const Template: StoryFn = ({ factions, fighters }) => (
  <div id="root">
    <Styles>
      <Game factions={factions} fighters={fighters} />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {
  factions: 3,
  fighters: 2,
};

export default {
  title: "Scenarios / Flight through checkpoints",
  parameters: {
    layout: "fullscreen",
  },
} as Meta;
