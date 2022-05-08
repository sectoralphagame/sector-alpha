import { matrix } from "mathjs";
import { createMarker } from "../archetypes/marker";
import { createSector, Sector } from "../archetypes/sector";
import { createShip, Ship } from "../archetypes/ship";
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
    ship = createShip(sim, {
      ...shipClasses.courierA,
      position: matrix([1, 0]),
      owner: new Faction(""),
      sector: createSector(sim, { name: "", position: matrix([0, 0, 0]) }),
    });
    sector = createSector(sim, { position: matrix([0, 0, 0]), name: "" });
  });

  it("is able to go to target position", () => {
    ship.cp.drive.target = createMarker(sim, {
      sector,
      value: matrix([1, 0.3]),
    });

    movingSystem.exec(1);

    expect(ship.cp.drive.targetReached).toBe(true);
  });

  it("is not able to go to target position if travel is too short", () => {
    ship.cp.drive.target = createMarker(sim, {
      sector,
      value: matrix([1, 10]),
    });

    movingSystem.exec(1);

    expect(ship.cp.drive.targetReached).toBe(false);
  });

  it("is able to make move order", () => {
    const orderExecutingSystem = new OrderExecutingSystem(sim);
    const m = createMarker(sim, { sector, value: matrix([1, 0.3]) });
    ship.cp.orders.value.push({
      type: "move",
      position: m,
    });

    orderExecutingSystem.exec();
    movingSystem.exec(1);

    expect(ship.cp.drive.targetReached).toBe(true);
  });
});
