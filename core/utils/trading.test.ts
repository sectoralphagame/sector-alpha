import { matrix } from "mathjs";
import type { Facility } from "../archetypes/facility";
import { facilityComponents } from "../archetypes/facility";
import type { Faction } from "../archetypes/faction";
import { createFaction } from "../archetypes/faction";
import type { Sector } from "../archetypes/sector";
import { createSector } from "../archetypes/sector";
import { changeBudgetMoney } from "../components/budget";
import { addStorage, removeStorage } from "../components/storage";
import { Sim } from "../sim";
import { settleStorageQuota } from "../systems/storageQuotaPlanning";
import { createOffers } from "../systems/trading";
import { createFarm, createWaterFacility } from "../world/facilities";
import { allocate, getNeededCommodities, resellCommodity } from "./trading";
import type { Ship } from "../archetypes/ship";
import { createShip } from "../archetypes/ship";
import { shipClasses } from "../world/ships";
import { dockShip } from "../systems/orderExecuting/dock";
import { tradeOrder } from "../systems/orderExecuting/trade";
import type { TradeAction } from "../components/orders";
import type { Commodity } from "../economy/commodity";
import type { RequireComponent } from "../tsHelpers";
import type { WithTrade } from "../economy/utils";
import { commodityPrices } from "./perCommodity";
import { changeRelations } from "../components/relations";
import { PathPlanningSystem } from "../systems/pathPlanning";
import { OrderExecutingSystem } from "../systems/orderExecuting/orderExecuting";

describe("Trading module", () => {
  let sim: Sim;
  let facility: Facility & RequireComponent<"compoundProduction" | "owner">;
  let sector: Sector;

  beforeEach(() => {
    sim = new Sim({
      systems: [new PathPlanningSystem(), new OrderExecutingSystem()],
    });
    // Run path planning
    sim.hooks.phase.init.notify(0);

    sector = createSector(sim, { name: "", position: matrix([0, 0, 0]) });
    facility = createFarm(
      {
        position: matrix([0, 0]),
        owner: createFaction("F", sim),
        sector,
      },
      sim
    ).requireComponents([...facilityComponents, "compoundProduction", "owner"]);
    facility.cp.budget.allocationIdCounter = 10;
    changeBudgetMoney(facility.cp.budget, 100);
  });

  it("properly sorts by most needed commodity 1", () => {
    settleStorageQuota(facility);
    createOffers(facility);

    expect(getNeededCommodities(facility)).toEqual(["fuel", "water"]);
  });

  it("properly sorts by most needed commodity 2", () => {
    removeStorage(facility.cp.storage, "food", 50);
    addStorage(facility.cp.storage, "water", 10);
    settleStorageQuota(facility);
    createOffers(facility);

    expect(facility.cp.trade.offers.food.quantity).not.toBeGreaterThan(0);
    expect(facility.cp.trade.offers.fuel.type).toBe("buy");
    expect(facility.cp.trade.offers.water.type).toBe("buy");
    expect(getNeededCommodities(facility)).toEqual(["fuel", "water"]);
  });

  it("properly allocates budget and storage for buy offers", () => {
    addStorage(facility.cp.storage, "food", 100, true);
    facility.cp.trade.offers.food = {
      price: 20,
      quantity: 100,
      type: "sell",
      active: true,
    };
    const shipFaction = createFaction("Ship faction", sim);
    changeBudgetMoney(shipFaction.cp.budget, 100);
    const ship = createShip(sim, {
      ...shipClasses[0],
      owner: shipFaction,
      position: matrix([0, 0, 0]),
      sector,
    });
    ship.cp.storage.max = 1000;

    const allocations = allocate(facility, {
      budget: shipFaction.id,
      commodity: "food",
      initiator: ship.id,
      factionId: shipFaction.id,
      price: 20,
      quantity: 5,
      type: "buy",
    });

    expect(allocations).toBeTruthy();
    expect(allocations!.buyer.storage).toBe(1);
    expect(allocations!.seller.storage).toBe(1);
    expect(shipFaction.cp.budget.allocations).toHaveLength(1);
    expect(shipFaction.cp.budget.allocations[0].id).toBe(1);
    expect(facility.cp.storage.allocations).toHaveLength(1);
    expect(facility.cp.storage.allocations[0].id).toBe(1);
  });

  it("properly allocates budget and storage for sell offers", () => {
    facility.cp.trade.offers.water = {
      price: 20,
      quantity: 100,
      type: "buy",
      active: true,
    };
    const shipFaction = createFaction("Ship faction", sim);
    changeRelations(
      shipFaction,
      sim.getOrThrow<Faction>(facility.cp.owner.id),
      0
    );
    changeBudgetMoney(shipFaction.cp.budget, 0);
    const ship = createShip(sim, {
      ...shipClasses[0],
      owner: shipFaction,
      position: matrix([0, 0, 0]),
      sector,
    });
    ship.cp.storage.max = 1000;
    addStorage(ship.cp.storage, "water", 100, true);

    const result = allocate(facility, {
      budget: shipFaction.id,
      commodity: "water",
      initiator: ship.id,
      factionId: shipFaction.id,
      price: 20,
      quantity: 5,
      type: "sell",
    });

    expect(result).not.toBeNull();
    expect(shipFaction.cp.budget.allocations).toHaveLength(0);
    expect(facility.cp.budget.allocations).toHaveLength(1);
    expect(facility.cp.budget.allocations[0].id).toBe(10);
    expect(facility.cp.storage.allocations).toHaveLength(1);
    expect(facility.cp.storage.allocations[0].id).toBe(1);
  });

  it("properly arranges trade between facilities", () => {
    addStorage(facility.cp.storage, "food", 100, true);
    settleStorageQuota(facility);
    changeBudgetMoney(facility.cp.budget, 10000);
    createOffers(facility);

    const waterFacility = createWaterFacility(
      { owner: createFaction("F2", sim), position: matrix([0, 0]), sector },
      sim
    ).requireComponents([...facilityComponents, "compoundProduction", "owner"]);
    settleStorageQuota(waterFacility);
    createOffers(waterFacility);

    const shipFaction = createFaction("Ship faction", sim);
    changeRelations(
      shipFaction,
      sim.getOrThrow<Faction>(facility.cp.owner.id),
      0
    );
    changeBudgetMoney(shipFaction.cp.budget, 1000);
    const ship = createShip(sim, {
      ...shipClasses[0],
      owner: shipFaction,
      position: matrix([0, 0, 0]),
      sector,
    });

    const result = resellCommodity(ship, "water", facility, waterFacility);
    const actions = ship.cp.orders.value.flatMap((og) =>
      og.actions.filter((o) => o.type === "trade")
    );

    expect(result).toBe(true);
    expect((actions[0] as TradeAction).targetId).toBe(waterFacility.id);
    expect((actions[0] as TradeAction).offer.type).toBe("buy");
    expect((actions[1] as TradeAction).targetId).toBe(facility.id);
    expect((actions[1] as TradeAction).offer.type).toBe("sell");
    expect(shipFaction.cp.budget.allocations).toHaveLength(1);
    expect(facility.cp.budget.allocations).toHaveLength(1);
    expect(facility.cp.budget.allocations[0].id).toBe(10);
    expect(facility.cp.storage.allocations).toHaveLength(1);
    expect(facility.cp.storage.allocations[0].id).toBe(1);
    expect(waterFacility.cp.storage.allocations).toHaveLength(1);
    expect(waterFacility.cp.storage.allocations[0].id).toBe(1);
  });

  it("properly cleans up dangling allocations if any entity was destroyed", () => {
    const shipFaction = createFaction("Ship faction", sim);
    changeBudgetMoney(shipFaction.cp.budget, 1000000);
    addStorage(facility.cp.storage, "food", 100);
    facility.cp.trade.offers.food = {
      active: true,
      price: commodityPrices.food.avg,
      quantity: 100,
      type: "sell",
    };
    const ship = createShip(sim, {
      ...shipClasses[0],
      owner: shipFaction,
      position: matrix([0, 0, 0]),
      sector,
    });

    const allocations = allocate(facility, {
      budget: shipFaction.id,
      commodity: "food",
      factionId: shipFaction.id,
      initiator: ship.id,
      price: commodityPrices.food.max,
      quantity: 10,
      type: "buy",
    });

    expect(allocations).not.toBeNull();
    expect(facility.cp.storage.allocations.length).toBe(1);
    expect(facility.cp.budget.allocations.length).toBe(0);
    expect(shipFaction.cp.budget.allocations.length).toBe(1);

    ship.unregister();

    expect(facility.cp.storage.allocations.length).toBe(0);
    expect(shipFaction.cp.budget.allocations.length).toBe(0);
  });
});

function trade(
  ship: Ship,
  commodity: Commodity,
  buyer: WithTrade,
  seller: WithTrade
) {
  const result = resellCommodity(ship, commodity, buyer, seller);
  const orders = ship.cp.orders.value.flatMap((og) =>
    og.actions.filter((o) => o.type === "trade")
  );

  expect(result).toBe(true);
  expect((orders[0] as TradeAction).targetId).toBe(seller.id);
  expect((orders[0] as TradeAction).offer.type).toBe("buy");
  expect((orders[1] as TradeAction).targetId).toBe(buyer.id);
  expect((orders[1] as TradeAction).offer.type).toBe("sell");

  const shipFactionBudget = ship.sim.getOrThrow<Faction>(ship.cp.owner.id).cp
    .budget;
  let prevShipFactionBudget = shipFactionBudget.available;
  dockShip(ship, seller);
  const buyOrderIndex = ship.cp.orders.value[0].actions.findIndex(
    (o) => o.type === "trade"
  );
  const buyOrder = ship.cp.orders.value[0].actions.splice(
    buyOrderIndex,
    1
  )[0] as TradeAction;
  const buyResult = tradeOrder(ship, buyOrder);

  expect(shipFactionBudget.available).toBeLessThanOrEqual(
    prevShipFactionBudget
  );
  expect(buyResult).toBe(true);

  prevShipFactionBudget = shipFactionBudget.available;
  dockShip(ship, buyer);
  const sellOrder = ship.cp.orders.value[0].actions.find(
    (o) => o.type === "trade"
  ) as TradeAction;
  const sellResult = tradeOrder(ship, sellOrder);

  expect(shipFactionBudget.available).toBeGreaterThanOrEqual(
    prevShipFactionBudget
  );
  expect(sellResult).toBe(true);
}

describe("Trade flow", () => {
  let sim: Sim;

  beforeAll(() => {
    sim = new Sim({
      systems: [new PathPlanningSystem(), new OrderExecutingSystem()],
    });
    createFaction("Player", sim)
      .addComponent({
        name: "missions",
        declined: 0,
        offer: null,
        value: [],
      })
      .addTag("player");
    // Run path planning
    sim.hooks.phase.init.notify(0);
  });

  it("between factions", () => {
    const sector = createSector(sim, { name: "", position: matrix([0, 0, 0]) });
    const farm = createFarm(
      {
        position: matrix([0, 0]),
        owner: createFaction("F", sim),
        sector,
      },
      sim
    ).requireComponents([...facilityComponents, "compoundProduction", "owner"]);
    changeBudgetMoney(farm.cp.budget, 10000);
    settleStorageQuota(farm);
    createOffers(farm);
    farm.cp.trade.offers.water.price = 110;

    const waterFacility = createWaterFacility(
      { owner: createFaction("F2", sim), position: matrix([0, 0]), sector },
      sim
    ).requireComponents([...facilityComponents, "compoundProduction", "owner"]);
    settleStorageQuota(waterFacility);
    createOffers(waterFacility);
    waterFacility.cp.trade.offers.water.price = 90;

    const shipFaction = createFaction("Ship faction", sim);
    changeRelations(shipFaction, sim.getOrThrow<Faction>(farm.cp.owner.id), 0);
    changeRelations(
      shipFaction,
      sim.getOrThrow<Faction>(waterFacility.cp.owner.id),
      0
    );
    changeBudgetMoney(shipFaction.cp.budget, 1000000);
    const prevShipFactionBudget = shipFaction.cp.budget.available;
    const ship = createShip(sim, {
      ...shipClasses[0],
      owner: shipFaction,
      position: matrix([0, 0, 0]),
      sector,
    });

    trade(ship, "water", farm, waterFacility);
    expect(shipFaction.cp.budget.available).toBeGreaterThan(
      prevShipFactionBudget
    );
  });

  it("within the same faction", () => {
    const sector = createSector(sim, { name: "", position: matrix([0, 0, 0]) });
    const f = createFaction("F", sim);
    changeBudgetMoney(f.cp.budget, 10000);

    const farm = createFarm(
      {
        position: matrix([0, 0]),
        owner: f,
        sector,
      },
      sim
    ).requireComponents([...facilityComponents, "compoundProduction", "owner"]);
    changeBudgetMoney(farm.cp.budget, 10000);
    settleStorageQuota(farm);
    createOffers(farm);

    const waterFacility = createWaterFacility(
      {
        owner: f,
        position: matrix([0, 0]),
        sector,
      },
      sim
    ).requireComponents([...facilityComponents, "compoundProduction", "owner"]);
    settleStorageQuota(waterFacility);
    createOffers(waterFacility);

    const ship = createShip(sim, {
      ...shipClasses[0],
      owner: f,
      position: matrix([0, 0, 0]),
      sector,
    });

    trade(ship, "water", farm, waterFacility);
  });
});
