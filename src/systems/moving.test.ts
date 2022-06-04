import { matrix } from "mathjs";
import { createMarker } from "../archetypes/marker";
import { createSector, Sector } from "../archetypes/sector";
import { createShip, Ship } from "../archetypes/ship";
import { setTarget } from "../components/drive";
import { Faction } from "../economy/faction";
import { Sim } from "../sim";
import { shipClasses } from "../world/ships";
import { MovingSystem } from "./moving";
import { OrderExecutingSystem } from "./orderExecuting/orderExecuting";

describe("Ship", () => {
  let sim: Sim;
  let movingSystem: MovingSystem;
  let ship: Ship;
  let sector: Sector;

  beforeEach(() => {
    sim = new Sim();
    movingSystem = new MovingSystem(sim);
    sector = createSector(sim, { position: matrix([0, 0, 0]), name: "" });
    ship = createShip(sim, {
      ...shipClasses.find((s) => s.name === "Courier A"),
      position: matrix([1, 0]),
      owner: new Faction(""),
      sector,
    });
  });

  it("is able to go to target position", () => {
    setTarget(
      ship.cp.drive,
      createMarker(sim, {
        sector,
        value: matrix([1, 0.3]),
      })
    );

    movingSystem.exec(1);

    expect(ship.cp.drive.targetReached).toBe(true);
  });

  it("is not able to go to target position if travel is too short", () => {
    setTarget(
      ship.cp.drive,
      createMarker(sim, {
        sector,
        value: matrix([1, 10]),
      })
    );

    movingSystem.exec(1);

    expect(ship.cp.drive.targetReached).toBe(false);
  });

  it("is able to make move order", () => {
    const orderExecutingSystem = new OrderExecutingSystem(sim);
    const m = createMarker(sim, { sector, value: matrix([1, 0.3]) });
    ship.cp.orders.value.push({
      type: "move",
      orders: [
        {
          type: "move",
          position: { entity: m, entityId: m.id },
        },
      ],
    });

    orderExecutingSystem.exec();
    movingSystem.exec(1);

    expect(ship.cp.drive.targetReached).toBe(true);
  });
});
