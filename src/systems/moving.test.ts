import { matrix } from "mathjs";
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

  beforeEach(() => {
    sim = new Sim();
    movingSystem = new MovingSystem(sim);
    ship = createShip(sim, {
      ...shipClasses.shipA,
      position: matrix([1, 0]),
      owner: new Faction(""),
    });
  });

  it("is able to go to target position", () => {
    ship.cp.drive.target = matrix([1, 0.3]);

    movingSystem.exec(1);

    expect(ship.cp.drive.targetReached).toBe(true);
  });

  it("is not able to go to target position if travel is too short", () => {
    ship.cp.drive.target = matrix([1, 10]);

    movingSystem.exec(1);

    expect(ship.cp.drive.targetReached).toBe(false);
  });

  it("is able to make move order", () => {
    const orderExecutingSystem = new OrderExecutingSystem(sim);
    ship.cp.orders.value.push({
      type: "move",
      position: matrix([1, 0.3]),
    });

    orderExecutingSystem.exec();
    movingSystem.exec(1);

    expect(ship.cp.drive.targetReached).toBe(true);
  });
});
