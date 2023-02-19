import { discriminate } from "@core/utils/maps";
import shuffle from "lodash/shuffle";
import type { Matrix } from "mathjs";
import { add, matrix, random } from "mathjs";
import type { Facility } from "../archetypes/facility";
import { createFacility } from "../archetypes/facility";
import { facilityModules } from "../archetypes/facilityModule";
import type { Faction } from "../archetypes/faction";
import type { Sector } from "../archetypes/sector";
import { sectorSize } from "../archetypes/sector";
import { hecsToCartesian } from "../components/hecsPosition";
import type { PAC } from "../components/production";
import { createCompoundProduction } from "../components/production";
import { setTexture } from "../components/render";
import { addStorage } from "../components/storage";
import type { Commodity } from "../economy/commodity";
import { commoditiesArray, mineableCommodities } from "../economy/commodity";
import type { Sim } from "../sim";
import { Cooldowns } from "../utils/cooldowns";
import { addFacilityModule } from "../utils/entityModules";
import { pickRandom } from "../utils/generators";
import { perCommodity } from "../utils/perCommodity";
import {
  getResourceProduction,
  getResourceUsage,
  getSectorResources,
} from "../utils/resources";
import { System } from "./system";

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

export class FacilityPlanningSystem extends System {
  cooldowns: Cooldowns<"plan">;

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("plan");
  }

  planMiningFacilities = (sector: Sector, faction: Faction): void => {
    const resources = getSectorResources(sector);
    const facilities = this.sim.queries.facilityWithProduction
      .get()
      .filter(
        (facility) =>
          facility.cp.owner?.id === faction.id &&
          facility.cp.position.sector === sector.id
      );
    const resourceUsageInFacilities = getResourceUsage(facilities);
    const sectorPosition = hecsToCartesian(
      sector.cp.hecsPosition.value,
      sectorSize / 10
    );

    perCommodity((commodity) => {
      const facilityModule = Object.values(facilityModules)
        .filter(discriminate("type", "production"))
        .find((fm) => fm.pac?.[commodity]?.consumes);
      const canBeMined =
        resources[commodity].max > 0 &&
        resourceUsageInFacilities[commodity] === 0 &&
        !!facilityModule;

      if (!canBeMined) {
        return;
      }

      const facility = createFacility(this.sim, {
        owner: faction,
        position: add(
          sectorPosition,
          matrix([
            random(-sectorSize / 20, sectorSize / 20),
            random(-sectorSize / 20, sectorSize / 20),
          ])
        ) as Matrix,
        sector,
      });
      facility.addComponent(createCompoundProduction());

      for (
        let i = 0;
        i <
        resources[commodity].max /
          ((10000 * facilityModule.pac![commodity]!.consumes) / 3600);
        i++
      ) {
        addFacilityModule(
          facility,
          facilityModules.containerMedium.create(this.sim, facility)
        );
        addFacilityModule(facility, facilityModule.create(this.sim, facility));
      }
    });
  };

  planHabitats = (faction: Faction): void => {
    this.sim.queries.sectors
      .get()
      .filter((sector) => sector.cp.owner?.id === faction.id)
      .forEach((sector) => {
        const sectorPosition = hecsToCartesian(
          sector.cp.hecsPosition.value,
          sectorSize / 10
        );

        const facility = createFacility(this.sim, {
          owner: faction,
          position: add(
            sectorPosition,
            matrix([
              random(-sectorSize / 20, sectorSize / 20),
              random(-sectorSize / 20, sectorSize / 20),
            ])
          ) as Matrix,
          sector,
        });
        setTexture(facility.cp.render, "fCiv");
        facility.addComponent(createCompoundProduction());

        addFacilityModule(
          facility,
          facilityModules.containerSmall.create(this.sim, facility)
        );
        addFacilityModule(
          facility,
          facilityModules.habitat.create(this.sim, facility)
        );
      });
  };

  planFactories = (faction: Faction): void => {
    const modulesToBuild: Array<
      (typeof facilityModules)[keyof typeof facilityModules]
    > = [];
    this.sim.queries.facilityWithProduction.reset();
    const facilities = this.sim.queries.facilityWithProduction
      .get()
      .filter((facility) => facility.cp.owner?.id === faction.id);
    const resourceUsageInFacilities = getResourceUsage(facilities);
    const resourcesProducedByFacilities = getResourceProduction(facilities);
    const factoryModules = Object.values(facilityModules).filter(
      discriminate("type", "production")
    );

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const productionModule = factoryModules.find(
        (facilityModule) =>
          facilityModule.pac &&
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
        Math.random() > 0.7 ||
        facility.cp.modules.ids.length > 16
      ) {
        if (facility && this.sim.getTime() === 0) {
          commoditiesArray.forEach((commodity) => {
            if (facility!.cp.compoundProduction!.pac[commodity].consumes) {
              addStorage(facility!.cp.storage, commodity, 500);
            }
          });
        }

        const sector = pickRandom(
          this.sim.queries.sectors
            .get()
            .filter((s) => s.cp.owner?.id === faction.id)
        );
        const sectorPosition = hecsToCartesian(
          sector.cp.hecsPosition.value,
          sectorSize / 10
        );

        facility = createFacility(this.sim, {
          owner: faction,
          position: add(
            sectorPosition,
            matrix([
              random(-sectorSize / 20, sectorSize / 20),
              random(-sectorSize / 20, sectorSize / 20),
            ])
          ) as Matrix,
          sector,
        });
        facility.addComponent(createCompoundProduction());
      }

      const facilityModule = buildQueue.pop()!;

      addFacilityModule(
        facility,
        facilityModules.containerSmall.create(this.sim, facility)
      );
      addFacilityModule(facility, facilityModule.create(this.sim, facility));
    }

    console.log(`Faction ${faction.cp.name.slug}`);
    console.table(
      perCommodity((commodity) => ({
        produced: resourcesProducedByFacilities[commodity],
        consumed: resourceUsageInFacilities[commodity],
        balance:
          resourcesProducedByFacilities[commodity] -
          resourceUsageInFacilities[commodity],
      }))
    );
  };

  exec = (): void => {
    // TODO: remove time limitation after introducing station builders
    if (this.cooldowns.canUse("plan") && this.sim.getTime() === 0) {
      this.cooldowns.use("plan", 500);

      this.sim.queries.ai.get().forEach((faction) => {
        this.sim.queries.sectors
          .get()
          .filter((sector) => sector.cp.owner?.id === faction.id)
          .forEach((sector) => {
            this.planMiningFacilities(sector, faction);
          });

        this.planHabitats(faction);
        this.planFactories(faction);
      });
    }
  };
}
