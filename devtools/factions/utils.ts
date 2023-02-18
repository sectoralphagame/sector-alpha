export interface FactionInput {
  name: string;
  slug: string;
  sectors: string[];
  blueprints: string[];
  color: string;
  type: string;
}

export interface RelationInput {
  factions: number[];
  value: number;
}

export interface FormData {
  factions: FactionInput[];
  relations: RelationInput[];
}
