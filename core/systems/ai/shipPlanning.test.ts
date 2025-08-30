import { Vec2 } from "ogl";
import { createFacility } from "../../archetypes/facility";
import { createFaction } from "../../archetypes/faction";
import { createSector } from "../../archetypes/sector";
import { Sim } from "../../sim/Sim";
import { getShipClass } from "../../world/ships";
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
      mining: "preferOwn",
    });
    faction.cp.blueprints.ships = [
      getShipClass("dart")!,
      getShipClass("gunboat")!,
      getShipClass("freighterA")!,
    ];
    const sector = createSector(sim, {
      position: [0, 0, 0],
      name: "Test Sector",
      slug: "test",
    });
    sector.addComponent({ name: "owner", id: faction.id });
    const shipyard = createFacility(sim, {
      owner: faction,
      position: new Vec2(0, 0),
      sector,
    });
    shipyard.addComponent({ name: "shipyard", building: null, queue: [] });
    expect(sim.entities.size).toBe(3);

    expect(system.getPatrolRequests(faction)[0].patrols).toBe(-2);
    expect(system.getPatrolRequests(faction)[0].fighters).toBe(-4);

    system.exec();
    expect(shipyard.cp.shipyard!.queue).toHaveLength(0);
    // 3 Freighters for shipyard
    // 2 Frigates
    // 4 Fighters
    expect(sim.entities.size).toBe(20);
    expect(system.getPatrolRequests(faction)[0].patrols).toBe(-2);
    expect(system.getPatrolRequests(faction)[0].fighters).toBe(-4);

    sim.timeOffset = 100;
    system.cooldowns.update(100);
    system.exec();
    expect(shipyard.cp.shipyard!.queue).toHaveLength(0);
    expect(sim.entities.size).toBe(20);
    expect(system.getPatrolRequests(faction)[0].patrols).toBe(0);
    expect(system.getPatrolRequests(faction)[0].fighters).toBe(0);
  });
});
