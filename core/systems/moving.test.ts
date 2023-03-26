import { distance, matrix } from "mathjs";
import { createFaction } from "../archetypes/faction";
import { createMarker } from "../archetypes/marker";
import type { Sector } from "../archetypes/sector";
import { createSector } from "../archetypes/sector";
import type { Ship } from "../archetypes/ship";
import { createShip } from "../archetypes/ship";
import { setTarget } from "../components/drive";
import { Sim } from "../sim";
import { shipClasses } from "../world/ships";
import { NavigatingSystem } from "./navigating";
import { MovingSystem } from "./moving";
import { OrderExecutingSystem } from "./orderExecuting/orderExecuting";

describe("Ship", () => {
  let sim: Sim;
  let navigatingSystem: NavigatingSystem;
  let movingSystem: MovingSystem;
  let ship: Ship;
  let sector: Sector;

  beforeEach(() => {
    sim = new Sim();
    movingSystem = new MovingSystem(sim);
    navigatingSystem = new NavigatingSystem(sim);
    sector = createSector(sim, { position: matrix([0, 0, 0]), name: "" });
    ship = createShip(sim, {
      ...shipClasses.find((s) => s.name === "Courier A")!,
      position: matrix([1, 0]),
      owner: createFaction("F", sim),
      sector,
    });
    ship.cp.drive.maneuver = 1;
  });

  it("is able to go to target position", () => {
    ship.cp.position.angle = Math.PI;
    setTarget(
      ship.cp.drive,
      createMarker(sim, {
        sector: sector.id,
        value: matrix([0, 0]),
        owner: 0,
      }).id
    );

    for (let index = 0; index < 7; index++) {
      navigatingSystem.exec(1);
      movingSystem.exec(1);
    }

    expect(ship.cp.drive.targetReached).toBe(true);
  });

  it("is not able to go to target position if travel is too short", () => {
    setTarget(
      ship.cp.drive,
      createMarker(sim, {
        sector: sector.id,
        value: matrix([1, 10]),
        owner: 0,
      }).id
    );

    navigatingSystem.exec(1);
    movingSystem.exec(1);

    expect(ship.cp.drive.targetReached).toBe(false);
  });

  it("is able to make move order", () => {
    const orderExecutingSystem = new OrderExecutingSystem(sim);
    const m = createMarker(sim, {
      sector: sector.id,
      value: matrix([1, 1]),
      owner: 0,
    });
    ship.cp.orders.value.push({
      origin: "manual",
      type: "move",
      actions: [
        {
          type: "move",
          targetId: m.id,
        },
      ],
    });

    orderExecutingSystem.exec();
    for (let index = 0; index < 7; index++) {
      navigatingSystem.exec(1);
      movingSystem.exec(1);
    }

    expect(distance(ship.cp.position.coord, matrix([1, 1]))).toBeLessThan(0.01);
    expect(ship.cp.drive.targetReached).toBe(true);
  });
});
