import type { MiningStrategy } from "@core/components/ai";

export interface FactionInput {
  name: string;
  slug: string;
  sectors: string[];
  blueprints: Record<"ships" | "facilityModules", string[]>;
  color: string;
  type: string;
  home: string | null;
  mining: MiningStrategy;
}

export interface RelationInput {
  factions: number[];
  value: number;
}

export interface FormData {
  factions: FactionInput[];
  relations: RelationInput[];
}
