import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { Sim } from "@core/sim";
import { cooldownUpdatingSystem } from "@core/systems/cooldowns";
import { attackingSystem } from "@core/systems/attacking";
import { createSector } from "@core/archetypes/sector";
import { createFaction } from "@core/archetypes/faction";
import Color from "color";
import type { Ship } from "@core/archetypes/ship";
import { createShip } from "@core/archetypes/ship";
import { shipClasses } from "@core/world/ships";
import { fromPolar } from "@core/utils/misc";
import settings from "@core/settings";
import { TacticalMap } from "@ui/components/TacticalMap/TacticalMap";
import { gameStore } from "@ui/state/game";
import { System } from "@core/systems/system";
import { defaultIndexer } from "@core/systems/utils/default";
import { Vec2 } from "ogl";
import type { Turret } from "@core/archetypes/turret";
import { applyPositionToChildren } from "@core/systems/moving";

class MovingSystem extends System {
  apply(sim: Sim) {
    this.sim = sim;

    sim.hooks.subscribe("phase", ({ phase }) => {
      if (phase === "update") {
        const shipsNum = defaultIndexer.ships.get().length;

        for (let i = 0; i < shipsNum; i++) {
          const ship = defaultIndexer.ships.get()[i];
          const t = sim.getTime() / 10;

          const angle = t + (i * Math.PI * 2) / shipsNum;
          const r = 0.1;

          ship.cp.position.coord.copy(fromPolar(angle, r));
          const nextAngle = t + ((i + 1) * Math.PI * 2) / shipsNum;
          const nextPos = fromPolar(nextAngle, r);
          const vec = nextPos.sub(ship.cp.position.coord);
          ship.cp.position.angle = Math.atan2(vec.y, vec.x);
          applyPositionToChildren(ship);
        }
      }
    });
  }
}

const Game: React.FC<{ fighters: number }> = ({ fighters: fightersNumber }) => {
  const [sim, setSim] = React.useState<Sim | null>(null);
  React.useEffect(() => {
    settings.bootTime = 0;
    const xSim = new Sim({
      systems: [cooldownUpdatingSystem, attackingSystem, new MovingSystem()],
    });
    xSim.init();

    const sector = createSector(xSim, {
      position: [0, 0, 0],
      name: "Sector",
      slug: "sector",
    });
    gameStore.setSector(sector);

    const fighters: Ship[] = [];
    for (let i = 0; i < fightersNumber; i++) {
      const faction = createFaction(`Faction #${i + 1}`, xSim);
      faction.cp.color.value = Color.hsv((i / fightersNumber) * 360, 100, 100)
        .rgb()
        .string();

      fighters.push(
        createShip(xSim, {
          ...shipClasses.find(({ slug }) => slug === "dart")!,
          angle: 0,
          position: new Vec2(0, 0),
          owner: faction,
          sector,
        })
      );
    }

    for (let i = 0; i < fighters.length; i++) {
      for (const { id, role } of fighters[i].cp.children?.entities ?? []) {
        if (role !== "turret") continue;

        const turret = xSim.getOrThrow<Turret>(id);
        turret.cp.damage.targetId = fighters[(i + 1) % fighters.length].id;
      }
    }

    xSim.start();
    setSim(xSim);

    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        if (xSim.speed === 0) xSim.unpause();
        else xSim.pause();
      }
    });

    return () => {
      xSim.destroy();
    };
  }, [fightersNumber]);

  if (!sim) return null;

  return <TacticalMap sim={sim} />;
};

const Template: StoryFn = ({ fighters }) => (
  <div id="root">
    <Styles>
      <Game fighters={fighters} />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {
  fighters: 3,
};

export default {
  title: "Scenarios / Shooting",
  parameters: {
    layout: "fullscreen",
  },
} as Meta;
