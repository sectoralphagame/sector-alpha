import { matrix } from "mathjs";
import { createFacility } from "../../archetypes/facility";
import { createFaction } from "../../archetypes/faction";
import { createSector } from "../../archetypes/sector";
import { Sim } from "../../sim/Sim";
import { shipClasses } from "../../world/ships";
import { ShipPlanningSystem } from "./shipPlanning";

describe("ShipPlanningSystem", () => {
  let sim: Sim;
  let system: ShipPlanningSystem;

  beforeEach(() => {
    system = new ShipPlanningSystem();
    sim = new Sim({
      systems: [system],
    });
  });

  it("should create proper patrol requests", () => {
    const faction = createFaction("Faction", sim);
    faction.addComponent({
      name: "ai",
      patrols: { formation: { fighters: 2 }, perSector: 2 },
      priceModifier: 0,
      stockpiling: 0,
      type: "territorial",
      home: 0,
      restrictions: { mining: false },
    });
    faction.cp.blueprints.ships = shipClasses;
    const sector = createSector(sim, {
      position: matrix([0, 0, 0]),
      name: "Test Sector",
    });
    sector.addComponent({ name: "owner", id: faction.id });
    const shipyard = createFacility(sim, {
      owner: faction,
      position: matrix([0, 0]),
      sector,
    });
    shipyard.addComponent({ name: "shipyard", building: null, queue: [] });
    expect(sim.entities.size).toBe(3);

    expect(system.getPatrolRequests(faction)[0].patrols).toBe(-2);
    expect(system.getPatrolRequests(faction)[0].fighters).toBe(-4);

    system.exec(0);
    expect(shipyard.cp.shipyard!.queue).toHaveLength(0);
    // 3 Freighters for shipyard
    // 2 Frigates
    // 4 Fighters
    expect(sim.entities.size).toBe(12);
    expect(system.getPatrolRequests(faction)[0].patrols).toBe(-2);
    expect(system.getPatrolRequests(faction)[0].fighters).toBe(-4);

    sim.timeOffset = 100;
    system.exec(100);
    expect(shipyard.cp.shipyard!.queue).toHaveLength(0);
    expect(sim.entities.size).toBe(12);
    expect(system.getPatrolRequests(faction)[0].patrols).toBe(0);
    expect(system.getPatrolRequests(faction)[0].fighters).toBe(0);
  });
});
