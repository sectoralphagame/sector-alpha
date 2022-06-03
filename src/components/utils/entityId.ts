import { MissingEntityError } from "../../errors";
import { Sim } from "../../sim";
import { Entity } from "../entity";

export interface EntityId<T extends Entity = Entity> {
  entity: T | null;
  entityId: number | null;
}

export function setEntity<T extends Entity = Entity>(
  entityId: EntityId<T>,
  entity: T
) {
  entityId.entity = entity;
  entityId.entityId = entity.id;
}

export function loadEntity<T extends Entity = Entity>(
  entityId: EntityId<T>,
  sim: Sim
) {
  const entity = sim.entities.find((e) => e.id === entityId.entityId);
  if (entity === undefined) {
    throw new MissingEntityError(entityId.entityId!);
  }

  entityId.entity = entity as T;
}

export function getEntity<T extends Entity = Entity>(
  entityId: EntityId<T>,
  sim: Sim
): T {
  if (!entityId.entity) {
    loadEntity(entityId, sim);
  }

  return entityId.entity!;
}

export function clearEntity(entityId: EntityId) {
  entityId.entity = null;
  entityId.entityId = null;
}

export interface EntityIds<T extends Entity = Entity> {
  entities: T[];
  entityIds: number[];
}

export function addEntity<T extends Entity = Entity>(
  entityIds: EntityIds<T>,
  child: T
) {
  entityIds.entities.push(child);
  entityIds.entityIds.push(child.id);
}

export function removeEntity<T extends Entity = Entity>(
  entityIds: EntityIds<T>,
  id: number
) {
  entityIds.entities = entityIds.entities.filter((e) => e.id !== id);
  entityIds.entityIds = entityIds.entityIds.filter((e) => e !== id);
}

export function setEntities<T extends Entity = Entity>(
  entityIds: EntityIds<T>,
  entities: T[]
) {
  entityIds.entities = entities;
  entityIds.entityIds = entities.map((e) => e.id);
}

export function loadEntities<T extends Entity = Entity>(
  entityIds: EntityIds<T>,
  sim: Sim
) {
  entityIds.entities = entityIds.entityIds.map((id) => {
    const entity = sim.entities.find((e) => e.id === id);
    if (entity === undefined) {
      throw new MissingEntityError(id);
    }

    return entity as T;
  });
}
