import { add, Matrix, matrix, random } from "mathjs";
import {
  createFaction,
  Faction,
  faction as asFaction,
} from "../archetypes/faction";
import { Sector, sectorSize } from "../archetypes/sector";
import { createShip } from "../archetypes/ship";
import { setMoney } from "../components/budget";
import { hecsToCartesian } from "../components/hecsPosition";
import { createRenderGraphics } from "../components/renderGraphics";
import { linkTeleportModules } from "../components/teleport";
import { Sim } from "../sim";
import { getFreighterTemplate } from "../systems/shipPlanning";
import { createTeleporter } from "./facilities";

function createTerritorialFaction(index: number, sim: Sim) {
  const char = String.fromCharCode(index + 65);
  const faction = createFaction(`Faction ${char}`, sim);
  faction.addComponent({ name: "ai", type: "territorial" });
  setMoney(faction.cp.budget, 1e8);

  return faction;
}

function createTradingFaction(index: number, sim: Sim) {
  const char = String.fromCharCode(index + 65);
  const faction = createFaction(`Traders ${char}`, sim);
  faction.addComponent({ name: "ai", type: "travelling" });
  setMoney(faction.cp.budget, 1e4);

  return faction;
}

function createLink(sim: Sim, sectors: Sector[]) {
  const [telA, telB] = sectors.map((sector) => {
    const position = hecsToCartesian(
      sector.cp.hecsPosition.value,
      sectorSize / 10
    );

    const teleporter = sim
      .getOrThrow(
        createTeleporter(
          {
            owner: sector.cp.owner
              ? asFaction(sim.getOrThrow(sector.cp.owner.id))
              : undefined!,
            position: add(
              position,
              matrix([
                random(-sectorSize / 20, sectorSize / 20),
                random(-sectorSize / 20, sectorSize / 20),
              ])
            ) as Matrix,
            sector,
          },
          sim
        ).cp.modules.ids[0]
      )
      .requireComponents(["teleport"]);

    return teleporter;
  });
  telA.addComponent(createRenderGraphics("link"));

  linkTeleportModules(telA, telB);
}

let faction: Faction;

export const factions = (sim: Sim) => {
  const sectors = sim.queries.sectors.get();
  sectors.forEach((sector, index) => {
    faction =
      !faction || Math.random() < 0.7
        ? createTerritorialFaction(index, sim)
        : faction;
    sector.addComponent({ name: "owner", id: faction.id });
  });

  for (let i = 2; i < sectors.length; i++) {
    createLink(sim, [sectors[i - 1], sectors[i]]);
  }

  createLink(sim, [sectors[0], sectors[2]]);
  createLink(sim, [sectors[0], sectors[7]]);

  for (let i = 0; i < 2; i++) {
    faction = createTradingFaction(i, sim);
    sim.queries.sectors.get().forEach((sector) => {
      const sectorPosition = hecsToCartesian(
        sector.cp.hecsPosition.value,
        sectorSize / 10
      );
      createShip(sim, {
        ...getFreighterTemplate(),
        position: add(
          sectorPosition,
          matrix([random(-30, 30), random(-30, 30)])
        ) as Matrix,
        owner: faction,
        sector,
      });
    });
  }
};
