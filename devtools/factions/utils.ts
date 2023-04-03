export interface FactionInput {
  name: string;
  slug: string;
  sectors: string[];
  blueprints: Record<"ships" | "facilityModules", string[]>;
  color: string;
  type: string;
  home: string | null;
}

export interface RelationInput {
  factions: number[];
  value: number;
}

export interface FormData {
  factions: FactionInput[];
  relations: RelationInput[];
}
