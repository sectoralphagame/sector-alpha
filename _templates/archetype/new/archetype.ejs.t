---
to: src/archetypes/<%= name %>.ts
---
import { CoreComponents, Entity } from "../components/entity";
import { MissingComponentError } from "../errors";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
  
export const <%= name %>Components = [
"minable",
"parent",
"position"
] as const;

// Ugly hack to transform <%= name %>Components array type to string union
const widenType = [...<%= name %>Components][0];
export type <%= h.changeCase.sentence(name) %>Component = typeof widenType;
export type <%= h.changeCase.sentence(name) %> = RequireComponent<<%= h.changeCase.sentence(name) %>Component>;

export function create<%= h.changeCase.sentence(name) %>(sim: Sim) {
const entity = new Entity(sim);

const components: Pick<CoreComponents, <%= h.changeCase.sentence(name) %>Component> = {
    
};
entity.components = components;

return entity as <%= h.changeCase.sentence(name) %>;
}

export function <%= name %>(entity: Entity): <%= h.changeCase.sentence(name) %> {
if (!entity.hasComponents(<%= name %>Components)) {
    throw new MissingComponentError(entity, <%= name %>Components);
}

return entity as <%= h.changeCase.sentence(name) %>;
}