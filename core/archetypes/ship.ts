import Color from "color";
import pick from "lodash/pick";
import type { DockSize } from "@core/components/dockable";
import { createDocks } from "@core/components/dockable";
import { Vec2 } from "ogl";
import { random } from "mathjs";
import { applyParentTransform } from "@core/systems/moving";
import { createDrive } from "../components/drive";
import { Entity } from "../entity";
import { createMining } from "../components/mining";
import { createRender } from "../components/render";
import { createCommodityStorage } from "../components/storage";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import type { Sector } from "./sector";
import type { Faction } from "./faction";
import type { ShipInput } from "../world/ships";
import { createTurret } from "./turret";

export const shipComponents = [
  "autoOrder",
  "drive",
  "movable",
  "dockable",
  "name",
  "orders",
  "owner",
  "position",
  "render",
  "storage",
  "journal",
  "model",
  "subordinates",
  "experience",
  "children",
] as const;

export type ShipComponent = (typeof shipComponents)[number];
export type Ship = RequireComponent<ShipComponent>;

export function ship(entity: Entity): Ship {
  return entity.requireComponents(shipComponents);
}

export interface InitialShipInput extends ShipInput {
  angle?: number;
  position: Vec2;
  owner: Faction;
  sector: Sector;
  docks?: Record<DockSize, number>;
}

export function createShipName(
  entity: RequireComponent<"model">,
  label?: string
) {
  const owner = entity.cp.owner?.id
    ? entity.sim.getOrThrow<Faction>(entity.cp.owner.id)
    : null;

  return owner
    ? [
        owner.cp.name.slug === "PLA" ? undefined : owner.cp.name.slug,
        label,
        entity.cp.model.value,
      ]
        .filter(Boolean)
        .join(" ")
    : [label, entity.cp.model.value].filter(Boolean).join(" ");
}

export function createShip(sim: Sim, initial: InitialShipInput): Ship {
  const entity = new Entity(sim) as Ship;

  entity
    .addComponent({
      name: "autoOrder",
      default:
        initial.role === "mining"
          ? { type: "mine", sectorId: initial.sector.id }
          : { type: "hold" },
    })
    .addComponent(
      createDrive(
        pick(initial, ["acceleration", "rotary", "cruise", "ttc", "maneuver"])
      )
    )
    .addComponent({
      name: "movable",
      acceleration: new Vec2(0),
      velocity: new Vec2(0),
      rotary: 0,
      drag: 0,
    })
    .addComponent({
      name: "orders",
      value: [],
    })
    .addComponent({ name: "owner", id: initial.owner.id })
    .addComponent({
      name: "position",
      angle: initial.angle ?? 0,
      coord: initial.position,
      sector: initial.sector.id,
      moved: false,
    })
    .addComponent(
      createRender({
        color: Color(initial.owner.cp.color.value).rgbNumber(),
        defaultScale: 0.4,
        texture: initial.texture,
        layer: "ship",
      })
    )
    .addComponent(createCommodityStorage())
    .addComponent({
      name: "dockable",
      size: initial.size,
      dockedIn: null,
      undocking: false,
    })
    .addComponent({ name: "journal", entries: [] })
    .addComponent({
      name: "hitpoints",
      hp: {
        base: initial.hitpoints.hp.value,
        max: initial.hitpoints.hp.value,
        regen: initial.hitpoints.hp.regen,
        value: initial.hitpoints.hp.value,
        modifiers: {},
      },
      shield: {
        max: initial.hitpoints.shield.value,
        regen: initial.hitpoints.shield.regen,
        value: initial.hitpoints.shield.value,
      },
      hitBy: {},
    })
    .addComponent({
      name: "model",
      slug: initial.slug,
      value: initial.name,
    })
    .addComponent({
      name: "name",
      value: createShipName(entity.requireComponents(["model"])),
    })
    .addComponent({ name: "subordinates", ids: [] })
    .addComponent({
      name: "experience",
      rank: 1,
      amount: 0,
    })
    .addComponent({
      name: "children",
      entities: [],
      slots: initial.slots,
    })
    .addTag("selection")
    .addTag("ship")
    .addTag(`role:${initial.role}`);

  for (const turretInput of initial.turrets) {
    const slot = entity.cp.children.slots.find(
      ({ slug }) => slug === turretInput.slot
    );
    const slotPosition = new Vec2(random(-4e-2, 4e-2), random(-4e-2, 4e-2));

    const turret = createTurret(sim, {
      slug: turretInput.class,
      angle: slot!.angle,
      damage: {
        angle: turretInput.angle,
      },
      slot: turretInput.slot,
      parentId: entity.id,
      transform: {
        coord: slotPosition.clone(),
        angle: slot!.angle,
        world: {
          coord: new Vec2(),
          angle: slot!.angle,
        },
      },
    });
    applyParentTransform(turret, entity.cp.position);
  }

  if (initial.mining) {
    entity.addComponent(createMining(initial.mining));
  }

  if (initial.role === "building") {
    entity.addComponent({
      active: false,
      name: "deployable",
      type: "facility",
      cancel: false,
    });
  }

  if (initial.role === "storage") {
    entity.addComponent({
      active: false,
      name: "deployable",
      type: "builder",
      cancel: false,
    });
  }

  // if (initial.damage) {
  //   entity.addComponent({
  //     ...initial.damage,
  //     name: "damage",
  //     targetId: null,
  //     output: {
  //       base: initial.damage.value,
  //       current: initial.damage.value,
  //     },
  //     modifiers: {},
  //     type: "kinetic",
  //   });
  // }

  if (initial.docks) {
    entity.addComponent(createDocks(initial.docks));
  }

  const shipEntity = ship(entity);
  shipEntity.cp.storage!.max = initial.storage;

  return shipEntity;
}
