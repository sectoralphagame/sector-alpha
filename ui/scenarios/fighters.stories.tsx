import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { Sim } from "@core/sim";
import { movingSystem } from "@core/systems/moving";
import { spottingSystem } from "@core/systems/ai/spotting";
import { hitpointsRegeneratingSystem } from "@core/systems/hitpointsRegenerating";
import { navigatingSystem } from "@core/systems/navigating";
import { cooldownUpdatingSystem } from "@core/systems/cooldowns";
import { orderPlanningSystem } from "@core/systems/ai/orderPlanning";
import { orderExecutingSystem } from "@core/systems/orderExecuting/orderExecuting";
import { attackingSystem } from "@core/systems/attacking";
import { deadUnregisteringSystem } from "@core/systems/deadUnregistering";
import { pathPlanningSystem } from "@core/systems/pathPlanning";
import { RenderingSystem } from "@core/systems/rendering";
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
import { selectingSystem } from "@core/systems/selecting";
import settings from "@core/settings";

const Game: React.FC<{ factions: number; fighters: number }> = ({
  factions,
  fighters,
}) => {
  React.useEffect(() => {
    settings.bootTime = 0;
    const renderingSystem = new RenderingSystem();
    renderingSystem.enableResizing = false;
    const sim = new Sim({
      systems: [
        pathPlanningSystem,
        movingSystem,
        spottingSystem,
        hitpointsRegeneratingSystem,
        navigatingSystem,
        cooldownUpdatingSystem,
        orderPlanningSystem,
        orderExecutingSystem,
        attackingSystem,
        deadUnregisteringSystem,
        renderingSystem,
        selectingSystem,
      ],
    });
    sim.init();

    const sector = createSector(sim, {
      position: [0, 0, 0],
      name: "Sector",
      slug: "sector",
    });

    const generatedFactions: Faction[] = [];
    for (let i = 0; i < factions; i++) {
      const faction = createFaction(`Faction #${i + 1}`, sim);
      faction.cp.color.value = Color.hsv((i / factions) * 360, 100, 100)
        .rgb()
        .string();
      faction.cp.policies.enemySpotted.military = "attack";
      generatedFactions.push(faction);

      for (let j = 0; j < fighters; j++) {
        const fighter = createShip(sim, {
          ...pickRandom(shipClasses.filter(({ slug }) => slug === "dart")),
          angle: random(-Math.PI, Math.PI),
          position: fromPolar(
            (2 * Math.PI * (i * fighters + j)) / (factions * fighters),
            random(4, 6)
          ),
          owner: faction,
          sector,
        });
        fighter.cp.orders.value = [
          {
            type: "move",
            actions: moveToActions(
              fighter,
              createWaypoint(sim, {
                value: [0, 0],
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

    sim.start();

    return () => {
      sim.destroy();
    };
  }, [factions, fighters]);

  return <div id="canvasRoot" />;
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
  title: "Scenarios / Fighters",
  parameters: {
    layout: "fullscreen",
  },
} as Meta;
