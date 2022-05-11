import { matrix } from "mathjs";
import { createShip } from "../archetypes/ship";
import { Sim } from "../sim";
import { shipClasses } from "../world/ships";
import { MovingSystem } from "./moving";
import { OrderExecutingSystem } from "./orderExecuting/orderExecuting";

describe("Ship", () => {
  let sim: Sim;
  let movingSystem: MovingSystem;

  beforeEach(() => {
    sim = new Sim();
    movingSystem = new MovingSystem(sim);
  });

  it("is able to go to target position", () => {
    const ship = createShip(sim, {
      ...shipClasses.shipA,
      position: matrix([1, 0]),
      owner: null,
    });
    ship.cp.drive.target = matrix([1, 0.3]);

    movingSystem.exec(1);

    expect(ship.cp.drive.targetReached).toBe(true);
  });

  it("is not able to go to target position if travel is too short", () => {
    const ship = createShip(sim, {
      ...shipClasses.shipA,
      position: matrix([1, 0]),
      owner: null,
    });
    ship.cp.drive.target = matrix([1, 10]);

    movingSystem.exec(1);

    expect(ship.cp.drive.targetReached).toBe(false);
  });

  it("is able to make move order", () => {
    const orderExecutingSystem = new OrderExecutingSystem(sim);
    const ship = createShip(sim, {
      ...shipClasses.shipA,
      position: matrix([1, 0]),
      owner: null,
    });
    ship.cp.orders.value.push({
      type: "move",
      position: matrix([1, 0.3]),
    });

    orderExecutingSystem.exec();
    movingSystem.exec(1);

    expect(ship.cp.drive.targetReached).toBe(true);
  });
});
