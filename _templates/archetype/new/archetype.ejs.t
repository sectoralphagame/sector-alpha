---
to: core/archetypes/<%= name %>.ts
---
import { CoreComponents, Entity } from "../components/entity";
import { MissingComponentError } from "../errors";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
  
export const <%= name %>Components = [

] as const;

// Ugly hack to transform <%= name %>Components array type to string union
const widenType = [...<%= name %>Components][0];
export type <%= h.capitalize(name) %>Component = typeof widenType;
export type <%= h.capitalize(name) %> = RequireComponent<<%= h.capitalize(name) %>Component>;

export function <%= name %>(entity: Entity): <%= h.capitalize(name) %> {
if (!entity.hasComponents(<%= name %>Components)) {
    throw new MissingComponentError(entity, <%= name %>Components);
}

return entity as <%= h.capitalize(name) %>;
}

export function create<%= h.capitalize(name) %>(sim: Sim) {
const entity = new Entity(sim);

const components: Pick<CoreComponents, <%= h.capitalize(name) %>Component> = {
    
};
entity.components = components;

return entity as <%= h.capitalize(name) %>;
}
