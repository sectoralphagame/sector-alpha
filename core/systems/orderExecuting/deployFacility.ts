import { facility } from "@core/archetypes/facility";
import { facilityModules } from "@core/archetypes/facilityModule";
import { Ship } from "@core/archetypes/ship";
import { createBudget } from "@core/components/budget";
import { CoreComponents } from "@core/components/component";
import { createDocks } from "@core/components/dockable";
import { createRender, destroy, Render } from "@core/components/render";
import { createCommodityStorage } from "@core/components/storage";
import { createTrade } from "@core/components/trade";
import { addFacilityModule } from "@core/utils/entityModules";

export function deployFacilityAction(entity: Ship): boolean {
  destroy(entity.cp.render);

  const render: Render = createRender({
    ...entity.cp.render,
    defaultScale: 1,
    maxZ: 0.065,
    texture: "fFactory",
    zIndex: 1,
  });

  (
    [
      "autoOrder",
      "commander",
      "deployable",
      "dockable",
      "docks",
      "drive",
      "mining",
      "name",
      "render",
      "storage",
      "orders",
    ] as Array<keyof CoreComponents>
  ).reduce((ship, component) => ship.removeComponent(component), entity);

  entity
    .addComponent(createBudget())
    .addComponent(createDocks({ large: 1, medium: 3, small: 3 }))
    .addComponent({
      name: "modules",
      ids: [],
    })
    .addComponent({
      name: "name",
      value: "Facility",
    })
    .addComponent(createCommodityStorage())
    .addComponent(createTrade())
    .addComponent({ name: "facilityModuleQueue", building: null, queue: [] })
    .addComponent({ name: "journal", entries: [] })
    .addComponent(render);

  const facilityEnt = facility(entity);

  addFacilityModule(
    facilityEnt,
    facilityModules.basic.create(entity.sim, facilityEnt)
  );

  entity.cp.position.angle = 0;

  return true;
}
