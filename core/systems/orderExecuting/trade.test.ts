import { matrix } from "mathjs";
import { createFacility, facilityComponents } from "../../archetypes/facility";
import type { Faction } from "../../archetypes/faction";
import { createFaction } from "../../archetypes/faction";
import { createSector } from "../../archetypes/sector";
import { createShip } from "../../archetypes/ship";
import {
  changeBudgetMoney,
  newBudgetAllocation,
} from "../../components/budget";
import { addStorage } from "../../components/storage";
import {
  createTransactionAllocations,
  type TransactionInput,
} from "../../components/trade";
import { Sim } from "../../sim";
import { arrangeTrade } from "../../utils/trading";
import { shipClasses } from "../../world/ships";
import { PathPlanningSystem } from "../pathPlanning";
import { removeOrder } from "./orderExecuting";
import type { RequireComponent } from "../../tsHelpers";
import { trade } from "./trade";
import { tradeAction } from "../../components/orders";
import type { Commodity } from "../../economy/commodity";

describe("Trading", () => {
  let sim: Sim;
  let source: RequireComponent<"drive" | "storage" | "dockable">;
  let target: RequireComponent<
    "storage" | "trade" | "owner" | "budget" | "docks" | "journal" | "position"
  >;
  let sourceOwner: Faction;
  let targetOwner: Faction;

  beforeEach(() => {
    sim = new Sim();
    sourceOwner = createFaction("SourceOwner", sim);
    targetOwner = createFaction("TargetOwner", sim);
    const sector = createSector(sim, {
      name: "Sector",
      position: [0, 0],
      slug: "sector",
    });
    source = createShip(sim, {
      ...shipClasses.find((sc) => sc.slug === "courierA")!,
      position: [0, 0],
      owner: sourceOwner,
      sector,
    });
    target = createFacility(sim, {
      position: [0, 0],
      owner: targetOwner,
      sector,
    }).requireComponents([...facilityComponents, "owner"]);
    target.cp.storage.max = 1000;
  });

  it("should be properly handled for sell orders", () => {
    addStorage(source.cp.storage, "food", 10);
    target.cp.trade.offers.food = {
      active: true,
      price: 10,
      quantity: 100,
      type: "buy",
    };
    const offer: TransactionInput = {
      budgets: {
        customer: sourceOwner.id,
        trader: targetOwner.id,
      },
      factionId: targetOwner.id,
      initiator: source.id,
      items: [
        {
          commodity: "food",
          price: 10,
          quantity: 10,
          type: "sell",
        },
      ],
      allocations: createTransactionAllocations(),
      tradeId: 0,
    };
    const order = tradeAction({
      offer,
      targetId: target.id,
    });
    trade(order, source, target);
    expect(source.cp.storage.stored.food).toBe(0);
    expect(target.cp.storage.stored.food).toBe(10);
    expect(sourceOwner.cp.budget.money).toBe(0);
    expect(targetOwner.cp.budget.money).toBe(0);
    expect(source.cp.storageTransfer).toBeDefined();
  });

  it("should be properly handled for sell orders with allocations", () => {
    addStorage(source.cp.storage, "food", 10);
    changeBudgetMoney(target.cp.budget, 100);
    const allocation = newBudgetAllocation(target.cp.budget, {
      amount: 100,
      issued: 0,
    });
    target.cp.trade.offers.food = {
      active: true,
      price: 10,
      quantity: 100,
      type: "buy",
    };
    const offer: TransactionInput = {
      budgets: {
        customer: sourceOwner.id,
        trader: target.id,
      },
      factionId: targetOwner.id,
      initiator: source.id,
      items: [
        {
          commodity: "food",
          price: 10,
          quantity: 10,
          type: "sell",
        },
      ],
      allocations: createTransactionAllocations(),
      tradeId: 0,
    };
    offer.allocations!.trader.budget = allocation.id;
    const order = tradeAction({
      offer,
      targetId: target.id,
    });
    trade(order, source, target);
    expect(source.cp.storage.stored.food).toBe(0);
    expect(target.cp.storage.stored.food).toBe(10);
    expect(sourceOwner.cp.budget.money).toBe(100);
    expect(targetOwner.cp.budget.money).toBe(0);
    expect(source.cp.storageTransfer).toBeDefined();
  });

  it("should be properly handled for buy orders", () => {
    addStorage(target.cp.storage, "food", 10);
    target.cp.trade.offers.food = {
      active: true,
      price: 10,
      quantity: 100,
      type: "sell",
    };
    const offer: TransactionInput = {
      budgets: {
        customer: sourceOwner.id,
        trader: targetOwner.id,
      },
      factionId: targetOwner.id,
      initiator: source.id,
      items: [
        {
          commodity: "food",
          price: 10,
          quantity: 10,
          type: "buy",
        },
      ],
      allocations: createTransactionAllocations(),
      tradeId: 0,
    };
    const order = tradeAction({
      offer,
      targetId: target.id,
    });
    trade(order, source, target);
    expect(source.cp.storage.stored.food).toBe(10);
    expect(target.cp.storage.stored.food).toBe(0);
    expect(sourceOwner.cp.budget.money).toBe(0);
    expect(targetOwner.cp.budget.money).toBe(0);
    expect(source.tags.has("busy")).toBe(true);
    expect(source.cp.storageTransfer).toBeDefined();
  });

  it("should be properly handled for buy orders with allocations", () => {
    changeBudgetMoney(sourceOwner.cp.budget, 100);
    const allocation = newBudgetAllocation(sourceOwner.cp.budget, {
      amount: 100,
      issued: 0,
    });
    addStorage(target.cp.storage, "food", 10);
    target.cp.trade.offers.food = {
      active: true,
      price: 10,
      quantity: 100,
      type: "sell",
    };
    const offer: TransactionInput = {
      budgets: {
        customer: sourceOwner.id,
        trader: target.id,
      },
      factionId: targetOwner.id,
      initiator: source.id,
      items: [
        {
          commodity: "food",
          price: 10,
          quantity: 10,
          type: "buy",
        },
      ],
      allocations: createTransactionAllocations(),
      tradeId: 0,
    };
    offer.allocations!.customer.budget = allocation.id;
    const order = tradeAction({
      offer,
      targetId: target.id,
    });
    trade(order, source, target);
    expect(source.cp.storage.stored.food).toBe(10);
    expect(target.cp.storage.stored.food).toBe(0);
    expect(sourceOwner.cp.budget.money).toBe(0);
    expect(target.cp.budget.money).toBe(100);
    expect(source.tags.has("busy")).toBe(true);
    expect(source.cp.storageTransfer).toBeDefined();
  });
});

describe("Trade action cleanup", () => {
  let sim: Sim;
  const commodity = "food" as Commodity;
  const quantity = 10;

  beforeEach(() => {
    const pathPlanning = new PathPlanningSystem();
    sim = new Sim({
      systems: [pathPlanning],
    });
    pathPlanning.exec();
  });

  it("should work for sell orders", () => {
    const faction = createFaction("Faction", sim);
    const sector = createSector(sim, {
      position: matrix([0, 0]),
      name: "Sector",
      slug: "sector",
    });
    const ship = createShip(sim, {
      ...shipClasses.find((sc) => sc.slug === "courierA")!,
      position: matrix([0, 0]),
      owner: faction,
      sector,
    });
    addStorage(ship.cp.storage, commodity, quantity);

    const facility = createFacility(sim, {
      owner: faction,
      position: matrix([0, 0]),
      sector,
    });
    facility.cp.storage.max = 1000;
    facility.cp.trade.offers[commodity] = {
      active: true,
      price: 10,
      quantity: 100,
      type: "buy",
    };
    changeBudgetMoney(facility.cp.budget, 10000);

    const offer = {
      budgets: {
        customer: faction.id,
        trader: facility.id,
      },
      factionId: faction.id,
      initiator: ship.id,
      items: [
        {
          commodity,
          price: 10,
          quantity,
          type: "sell" as "sell",
        },
      ],
      tradeId: 0,
    };
    const actions = arrangeTrade(
      ship,
      offer,
      facility.requireComponents([...facilityComponents, "owner"])
    )!;

    // Move, dock, trade
    expect(actions).toHaveLength(3);

    ship.cp.orders.value.push({
      origin: "auto",
      type: "trade",
      actions,
    });

    expect(facility.cp.storage.allocations).toHaveLength(1);
    expect(facility.cp.budget.allocations).toHaveLength(1);
    expect(ship.cp.storage.allocations).toHaveLength(1);
    expect(faction.cp.budget.allocations).toHaveLength(0);

    removeOrder(ship, 0);

    expect(facility.cp.storage.allocations).toHaveLength(0);
    expect(facility.cp.budget.allocations).toHaveLength(0);
    expect(ship.cp.storage.allocations).toHaveLength(0);
    expect(faction.cp.budget.allocations).toHaveLength(0);
  });

  it("should work for buy orders", () => {
    const faction = createFaction("Faction", sim);
    changeBudgetMoney(faction.cp.budget, 10000);
    const sector = createSector(sim, {
      position: matrix([0, 0]),
      name: "Sector",
      slug: "sector",
    });
    const ship = createShip(sim, {
      ...shipClasses.find((sc) => sc.slug === "courierA")!,
      position: matrix([0, 0]),
      owner: faction,
      sector,
    });

    const facility = createFacility(sim, {
      owner: faction,
      position: matrix([0, 0]),
      sector,
    });
    facility.cp.storage.max = 1000;
    addStorage(facility.cp.storage, commodity, quantity);
    facility.cp.trade.offers[commodity] = {
      active: true,
      price: 10,
      quantity,
      type: "sell",
    };

    const offer = {
      budgets: {
        customer: faction.id,
        trader: facility.id,
      },
      factionId: faction.id,
      initiator: ship.id,
      items: [
        {
          commodity,
          price: 10,
          quantity,
          type: "buy" as "buy",
        },
      ],
      tradeId: 0,
    };
    const actions = arrangeTrade(
      ship,
      offer,
      facility.requireComponents([...facilityComponents, "owner"])
    )!;

    // Move, dock, trade
    expect(actions).toHaveLength(3);

    ship.cp.orders.value.push({
      origin: "auto",
      type: "trade",
      actions,
    });

    expect(facility.cp.storage.allocations).toHaveLength(1);
    expect(facility.cp.budget.allocations).toHaveLength(0);
    expect(ship.cp.storage.allocations).toHaveLength(1);
    expect(faction.cp.budget.allocations).toHaveLength(1);

    removeOrder(ship, 0);

    expect(facility.cp.storage.allocations).toHaveLength(0);
    expect(facility.cp.budget.allocations).toHaveLength(0);
    expect(ship.cp.storage.allocations).toHaveLength(0);
    expect(faction.cp.budget.allocations).toHaveLength(0);
  });
});
