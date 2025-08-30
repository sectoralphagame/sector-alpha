import type { Position } from "@core/components/position";
import { isDev } from "@core/settings";
import type { RequireComponent } from "@core/tsHelpers";
import { discriminate } from "@core/utils/maps";
import { random } from "mathjs";
import keyBy from "lodash/keyBy";
import type { Vec2 } from "ogl";
import { fromPolar } from "@core/utils/misc";
import { entityIndexer } from "@core/entityIndexer/entityIndexer";
import type { AsteroidField } from "@core/archetypes/asteroidField";
import { asteroidFieldComponents } from "@core/archetypes/asteroidField";
import {
  filter,
  first,
  fromEntries,
  map,
  pipe,
  sort,
  sum,
  toArray,
} from "@fxts/core";
import capitalize from "lodash/capitalize";
import shuffle from "lodash/shuffle";
import { findModules } from "@core/utils/findInAncestors";
import { getSectorsInTeleportRange } from "@core/economy/utils";
import { NotImplementedError } from "@core/errors";
import type { Facility } from "../../archetypes/facility";
import {
  createFacilityName,
  createFacility,
  facilityComponents,
} from "../../archetypes/facility";
import { facilityModules } from "../../archetypes/facilityModule";
import type { Faction } from "../../archetypes/faction";
import type { Sector } from "../../archetypes/sector";
import { sectorSize } from "../../archetypes/sector";
import type { PAC } from "../../components/production";
import { addStorage } from "../../components/storage";
import type { Commodity, MineableCommodity } from "../../economy/commodity";
import {
  commoditiesArray,
  commodityLabel,
  mineableCommodities,
  mineableCommoditiesArray,
} from "../../economy/commodity";
import type { Sim } from "../../sim";
import { addFacilityModule } from "../../utils/entityModules";
import { pickRandom } from "../../utils/generators";
import { perCommodity } from "../../utils/perCommodity";
import { getResourceProduction, getResourceUsage } from "../../utils/resources";
import { maxFacilityModules } from "../facilityBuilding";
import { settleStorageQuota } from "../storageQuotaPlanning";
import { System } from "../system";
import facilityTemplatesData from "../../world/data/facilityTemplates.json";
import { MiningSystem } from "../mining";

const facilityTemplates = keyBy(facilityTemplatesData, "slug");
const safetyMiningOffset = 2;
const averageSMinerFreightMonth = 200;

interface FacilityPlan {
  modules: string[];
  position: Vec2;
  sector: Sector;
  name: string;
}

// FIXME: merge with FacilityPlanningSystem.createFacilityFromPlan
function createFacilityFromTemplate(
  template: string,
  sim: Sim,
  input: { owner: Faction; position: Pick<Position, "sector" | "coord"> }
) {
  const facility = createFacility(sim, {
    owner: input.owner,
    position: input.position.coord,
    sector: sim.getOrThrow(input.position.sector),
  });
  facility.cp.name.value = createFacilityName(
    facility,
    facilityTemplates[template].name
  );

  for (const m of facilityTemplates[template].modules) {
    addFacilityModule(facility, facilityModules[m].create(sim, facility));
  }

  return facility;
}

function isAbleToBuild(
  pac: Partial<PAC>,
  resourcesProducedByFacilities: Record<Commodity, number>,
  resourceUsageInFacilities: Record<Commodity, number>,
  stockpiling: number
) {
  return Object.entries(pac).every(([commodity, { consumes, produces }]) =>
    produces
      ? !Object.values<string>(mineableCommodities).includes(commodity)
      : resourcesProducedByFacilities[commodity] /
          (consumes + resourceUsageInFacilities[commodity]) >
        stockpiling
  );
}

export function addStartingCommodities(facility: RequireComponent<"storage">) {
  settleStorageQuota(facility);
  commoditiesArray.forEach((commodity) => {
    if (facility.cp.storage.quota[commodity]) {
      addStorage(
        facility!.cp.storage,
        commodity,
        Math.floor(facility.cp.storage.quota[commodity] * random(0.4, 0.7))
      );
    }
  });
}

export function getRequiredSpots(consumption: number): number {
  return Math.ceil(consumption / averageSMinerFreightMonth);
}

export type ResourceUsage = Record<MineableCommodity, number>;

export function addResourceUsage(
  a: ResourceUsage,
  b: ResourceUsage
): ResourceUsage {
  return pipe(
    mineableCommoditiesArray,
    map(
      (commodity) =>
        [commodity, a[commodity] + b[commodity]] as [MineableCommodity, number]
    ),
    fromEntries
  );
}
export function sumResourceUsage(usage: ResourceUsage): number {
  return sum(Object.values(usage));
}
const emptyResourceUsage: ResourceUsage = pipe(
  mineableCommoditiesArray,
  map((commodity) => [commodity, 0] as [MineableCommodity, number]),
  fromEntries
);

export function getReservedMiningSpots(
  facility: RequireComponent<"modules">
): ResourceUsage {
  const usage = { ...emptyResourceUsage };

  for (const facilityModule of findModules(facility, "production")) {
    for (const commodity of mineableCommoditiesArray) {
      usage[commodity] += facilityModule.cp.production.pac[commodity].consumes;
    }
  }

  for (const commodity of mineableCommoditiesArray) {
    usage[commodity] = getRequiredSpots(usage[commodity]);
  }

  return usage;
}

function getSectorPosition(
  sector: Sector,
  radius?: number,
  point?: Vec2
): Vec2 {
  let position: Vec2;
  let isNearAnyFacility: boolean;
  const r = radius ?? -sectorSize / 20;

  do {
    position = fromPolar(random(0, 2 * Math.PI), random(0, r));
    if (point) {
      position.add(point);
    }

    isNearAnyFacility = sector.sim.index.facilities
      .get()
      .filter((facility) => facility.cp.position.sector === sector.id)
      .some((facility) => facility.cp.position.coord.distance(position) < 10);
  } while (isNearAnyFacility);

  return position;
}

export class FacilityPlanningSystem extends System<"plan"> {
  apply = (sim: Sim) => {
    super.apply(sim);

    sim.hooks.subscribe("phase", ({ phase }) => {
      if (phase === "update") {
        this.exec();
      }
    });
  };

  createNewFactory = (faction: Faction): Facility => {
    const sector = pickRandom(
      this.sim.index.sectors.get().filter((s) => s.cp.owner?.id === faction.id)
    );
    const facility = createFacility(this.sim, {
      owner: faction,
      position: fromPolar(random(0, 2 * Math.PI), random(0, sectorSize / 20)),
      sector,
    });
    facility.cp.name.value = createFacilityName(facility, "Factory");
    addFacilityModule(
      facility,
      facilityModules.basicHabitat.create(this.sim, facility)
    );
    addFacilityModule(
      facility,
      facilityModules.basicStorage.create(this.sim, facility)
    );
    addFacilityModule(
      facility,
      facilityModules.smallDefense.create(this.sim, facility)
    );
    for (let i = 0; i < 3; i++) {
      addFacilityModule(
        facility,
        facilityModules.containerLarge.create(this.sim, facility)
      );
    }

    if (facility.hasComponents(["crew"])) {
      facility.cp.crew.workers.current = facility.cp.crew.workers.max * 0.7;
    }

    return facility;
  };

  createFacilityFromPlan(plan: FacilityPlan, owner: Faction) {
    const facility = createFacility(this.sim, {
      owner,
      position: plan.position,
      sector: plan.sector,
    });
    facility.cp.name.value = createFacilityName(facility, plan.name);

    for (const m of plan.modules) {
      addFacilityModule(
        facility,
        facilityModules[m].create(this.sim, facility)
      );
    }

    this.logger.log(`Planned ${plan.name}`);
    return facility;
  }

  // eslint-disable-next-line class-methods-use-this
  getSectorFieldUsage(sector: Sector, fields: AsteroidField[]) {
    const availableResources = mineableCommoditiesArray.filter((resource) =>
      fields.find((f) => f.cp.mineable.resources[resource] > 0)
    );
    const miningComplexes = [
      ...entityIndexer.searchBySector(sector.id, facilityComponents),
    ].filter((f) =>
      findModules(f, "production").some((m) =>
        availableResources.some(
          (mineable) => m.cp.production.pac[mineable].consumes > 0
        )
      )
    );

    const spots = pipe(
      fields,
      map(
        (f) =>
          [f.id, { max: f.cp.mineable.mountPoints.max, used: 0 }] as [
            number,
            { max: number; used: number }
          ]
      ),
      fromEntries
    );
    const reserved = miningComplexes
      .map(getReservedMiningSpots)
      .reduce(addResourceUsage, { ...emptyResourceUsage });

    while (sumResourceUsage(reserved) > 0) {
      for (const commodity of mineableCommoditiesArray) {
        const bestField = pipe(
          fields,
          filter(
            (f) => spots[f.id].used + safetyMiningOffset < spots[f.id].max
          ),
          sort(
            (a, b) =>
              MiningSystem.getFieldEfficiencyFactor(b, commodity) -
              MiningSystem.getFieldEfficiencyFactor(a, commodity)
          ),
          first
        );
        if (!bestField) {
          throw new NotImplementedError();
        }
        const available =
          spots[bestField.id].max -
          safetyMiningOffset -
          spots[bestField.id].used;
        const allocated = Math.min(available, reserved[commodity]);

        spots[bestField.id].used += allocated;
        reserved[commodity] -= allocated;
      }
    }

    return spots;
  }

  getFieldsForMining(
    sector: Sector,
    faction: RequireComponent<"ai">
  ): AsteroidField[] {
    return [
      ...entityIndexer.searchBySector(sector.id, asteroidFieldComponents),
      ...(faction.cp.ai!.mining === "expansive"
        ? pipe(
            getSectorsInTeleportRange(sector, 1, this.sim),
            filter((s) => s.cp.owner?.id !== faction.id),
            map((s) => [
              ...entityIndexer.searchBySector(s.id, asteroidFieldComponents),
            ]),
            toArray
          )
        : []
      ).flat(),
    ];
  }

  planMiningFacility(sector: Sector, faction: Faction): FacilityPlan | null {
    const fields = this.getFieldsForMining(
      sector,
      faction.requireComponents(["ai"])
    );
    const factionBlueprints = Object.values(facilityModules).filter((f) =>
      faction.cp.blueprints.facilityModules.some((fm) => fm.slug === f.slug)
    );
    const spots = this.getSectorFieldUsage(sector, fields);

    if (Object.keys(spots).length === 0) return null;

    const resourceUsage = getResourceUsage([
      ...entityIndexer.searchBySector(sector.id, [
        "modules",
        "compoundProduction",
      ]),
    ]);
    const availableResources = mineableCommoditiesArray
      .filter((resource) =>
        fields.some(
          (f) =>
            f.cp.mineable.resources[resource] > 0 &&
            spots[f.id].max > spots[f.id].used + safetyMiningOffset &&
            factionBlueprints.some(
              (bp) =>
                bp.type === "production" &&
                (bp.pac[resource]?.consumes ?? 0) > 0
            )
        )
      )
      .sort((a, b) => resourceUsage[a] - resourceUsage[b]);

    for (const resource of availableResources) {
      this.logger.log(
        `Evaluating ${resource} mining facility in ${sector.cp.name.value} for ${faction.cp.name.slug}`
      );
      const facilityModule = factionBlueprints
        .filter(discriminate("type", "production"))
        .find((fm) => fm.pac?.[resource]?.consumes);
      if (!facilityModule) continue;

      const candidateField = fields.find(
        (f) =>
          spots[f.id].max >
          safetyMiningOffset +
            spots[f.id].used +
            getRequiredSpots(facilityModule.pac[resource]!.consumes)
      );
      if (!candidateField) continue;

      const plan: FacilityPlan = {
        position: fromPolar(random(0, 2 * Math.PI), random(0, sectorSize / 20)),
        modules: [
          "basicHabitat",
          "basicStorage",
          "containerLarge",
          "smallDefense",
          facilityModule.slug,
        ],
        name: `${capitalize(commodityLabel[resource])} Mining Complex`,
        sector,
      };
      this.logger.log(`Planned ${plan.name}`);

      return plan;
    }

    return null;
  }

  planMiningFacilities = (sector: Sector, faction: Faction): void => {
    let plan: FacilityPlan | null;
    // eslint-disable-next-line no-cond-assign
    while ((plan = this.planMiningFacility(sector, faction))) {
      const facility = this.createFacilityFromPlan(plan, faction);
      addStartingCommodities(facility);
      plan = this.planMiningFacility(sector, faction);
    }
  };

  planHubs = (faction: Faction): void => {
    if (faction.cp.name.slug === "TAU") {
      this.planHives(faction);
      return;
    }

    for (const sector of this.sim.index.sectors.getIt()) {
      if (sector.cp.owner?.id !== faction.id) continue;

      const position = fromPolar(
        random(0, 2 * Math.PI),
        random(0, sectorSize / 50)
      );

      const facility = createFacility(this.sim, {
        owner: faction,
        position,
        sector,
      });
      facility.cp.name.value = createFacilityName(facility, "Hub");
      facility.cp.render.texture = "fHub";
      addFacilityModule(
        facility,
        facilityModules.hub.create(this.sim, facility)
      );
      addFacilityModule(
        facility,
        facilityModules.basicHabitat.create(this.sim, facility)
      );
      addFacilityModule(
        facility,
        facilityModules.containerMedium.create(this.sim, facility)
      );
      for (let i = 0; i < 3; i++) {
        addFacilityModule(
          facility,
          facilityModules.smallDefense.create(this.sim, facility)
        );
      }

      addStartingCommodities(facility);
    }
  };

  planHives = (faction: Faction): void => {
    for (const sector of this.sim.index.sectors.getIt()) {
      if (sector.cp.owner?.id !== faction.id) continue;

      const coord = fromPolar(
        random(0, 2 * Math.PI),
        random(0, sectorSize / 50)
      );

      const hive = createFacilityFromTemplate("outpostHive", this.sim, {
        position: {
          coord,
          sector: sector.id,
        },
        owner: faction,
      });
      hive.cp.render.texture = "fHub";
    }
  };

  planFactories = (faction: Faction): void => {
    const modulesToBuild: Array<
      (typeof facilityModules)[keyof typeof facilityModules]
    > = [];
    const facilities = this.sim.index.facilityWithProduction
      .get()
      .filter((facility) => facility.cp.owner?.id === faction.id);
    const resourceUsageInFacilities = getResourceUsage(facilities);
    const resourcesProducedByFacilities = getResourceProduction(facilities);
    const factionBlueprints = Object.values(facilityModules).filter((f) =>
      faction.cp.blueprints.facilityModules.find((fm) => fm.slug === f.slug)
    );
    const factoryModules = factionBlueprints.filter(
      discriminate("type", "production")
    );

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const productionModule = factoryModules.find(
        (facilityModule) =>
          facilityModule.pac &&
          !mineableCommoditiesArray.some(
            (mc) => facilityModule.pac[mc]?.consumes
          ) &&
          isAbleToBuild(
            facilityModule.pac,
            resourcesProducedByFacilities,
            resourceUsageInFacilities,
            faction.cp.ai!.stockpiling
          )
      );
      if (!productionModule) break;
      modulesToBuild.push(productionModule);
      commoditiesArray.forEach((commodity) => {
        if (productionModule.pac && productionModule.pac[commodity]?.consumes) {
          resourceUsageInFacilities[commodity] +=
            productionModule.pac![commodity]!.consumes;
        }

        if (productionModule.pac && productionModule.pac[commodity]?.produces) {
          resourcesProducedByFacilities[commodity] +=
            productionModule.pac![commodity]!.produces;
        }
      });
    }

    let facility: Facility | undefined;

    const buildQueue = shuffle(modulesToBuild);
    while (buildQueue.length > 0) {
      if (
        !facility ||
        Math.random() > 0.8 ||
        facility.cp.modules.ids.length >= maxFacilityModules
      ) {
        if (facility && this.sim.getTime() === 0) {
          addStartingCommodities(facility);
        }

        facility = this.createNewFactory(faction);
      }

      const facilityModule = buildQueue.pop()!;

      addFacilityModule(facility, facilityModule.create(this.sim, facility));
    }

    if (isDev) {
      // eslint-disable-next-line no-console
      console.log(`Faction ${faction.cp.name.slug}`);
      // eslint-disable-next-line no-console
      console.table(
        perCommodity((commodity) => ({
          produced: resourcesProducedByFacilities[commodity],
          consumed: resourceUsageInFacilities[commodity],
          balance:
            resourcesProducedByFacilities[commodity] -
            resourceUsageInFacilities[commodity],
        }))
      );
    }
  };

  exec = (): void => {
    // TODO: remove time limitation after introducing station builders
    if (this.cooldowns.canUse("plan") && this.sim.getTime() === 0) {
      this.cooldowns.use("plan", 500);

      this.sim.index.ai.get().forEach((faction) => {
        const sectorWithSSF = pickRandom(
          this.sim.index.sectors
            .get()
            .filter((sector) => sector.cp.owner?.id === faction.id)
        );

        if (!sectorWithSSF) return;

        createFacilityFromTemplate("baseFarm", this.sim, {
          position: {
            coord: getSectorPosition(sectorWithSSF),
            sector: sectorWithSSF.id,
          },
          owner: faction,
        });

        this.sim.index.sectors
          .get()
          .filter((sector) => sector.cp.owner?.id === faction.id)
          .forEach((sector) => {
            this.planMiningFacilities(sector, faction);
          });
        this.planHubs(faction);
        this.planFactories(faction);
      });
    }
  };
}

export const facilityPlanningSystem = new FacilityPlanningSystem();
