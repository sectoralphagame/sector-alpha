import { matrix } from "mathjs";
import { Facility, facilityComponents } from "../archetypes/facility";
import { createFaction, Faction } from "../archetypes/faction";
import { createSector, Sector } from "../archetypes/sector";
import { changeBudgetMoney } from "../components/budget";
import { addStorage, removeStorage } from "../components/storage";
import { Sim } from "../sim";
import { settleStorageQuota } from "../systems/storageQuotaPlanning";
import { createOffers } from "../systems/trading";
import { createFarm, createWaterFacility } from "../world/facilities";
import { allocate, getNeededCommodities, resellCommodity } from "./trading";
import { createShip, Ship } from "../archetypes/ship";
import { shipClasses } from "../world/ships";
import { dockShip } from "../systems/orderExecuting/dock";
import { tradeOrder } from "../systems/orderExecuting/trade";
import { TradeAction } from "../components/orders";
import { Commodity } from "../economy/commodity";
import { RequireComponent } from "../tsHelpers";
import { WithTrade } from "../economy/utils";

describe("Trading module", () => {
  let sim: Sim;
  let facility: Facility & RequireComponent<"compoundProduction" | "owner">;
  let sector: Sector;

  beforeEach(() => {
    sim = new Sim();
    // Run path planning
    sim.systems[0].exec(0);

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

    const allocations = allocate(facility, {
      budget: shipFaction.id,
      commodity: "food",
      initiator: 4,
      factionId: shipFaction.id,
      price: 20,
      quantity: 5,
      type: "buy",
    });

    expect(allocations).toBeTruthy();
    expect(allocations!.storage?.id).toBe(1);
    expect(shipFaction.cp.budget.allocations).toHaveLength(1);
    expect(shipFaction.cp.budget.allocations[0].id).toBe(1);
    expect(facility.cp.storage.allocations).toHaveLength(1);
    expect(facility.cp.storage.allocations[0].id).toBe(1);
  });

  it("properly allocates budget and storage for sell offers", () => {
    addStorage(facility.cp.storage, "food", 100, true);
    facility.cp.trade.offers.water = {
      price: 20,
      quantity: 100,
      type: "buy",
      active: true,
    };
    const shipFaction = createFaction("Ship faction", sim);
    changeBudgetMoney(shipFaction.cp.budget, 0);

    allocate(facility, {
      budget: shipFaction.id,
      commodity: "water",
      initiator: 4,
      factionId: shipFaction.id,
      price: 20,
      quantity: 5,
      type: "sell",
    });

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
    sim = new Sim();
    // Run path planning
    sim.systems[0].exec(0);
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
