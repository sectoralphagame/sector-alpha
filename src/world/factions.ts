import { add, Matrix, matrix, random } from "mathjs";
import { createFaction, Faction } from "../archetypes/faction";
import { sectorSize } from "../archetypes/sector";
import { createShip } from "../archetypes/ship";
import { setMoney } from "../components/budget";
import { hecsToCartesian } from "../components/hecsPosition";
import { Sim } from "../sim";
import { getFreighterTemplate } from "../systems/shipPlanning";

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
