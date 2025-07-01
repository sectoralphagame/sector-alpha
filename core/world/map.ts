import type { MiningStrategy } from "@core/components/ai";
import { mineableCommoditiesArray } from "@core/economy/commodity";
import type { JSONSchemaType } from "ajv";
import Ajv from "ajv";
import mapData from "./data/map.json";

const ajv = new Ajv({ allErrors: true, strict: true });

interface StarProp {
  type: "star";
  position: [number, number, number];
  scale: number;
  color: string;
  color2: string;
  noise: number;
  noisePower: number;
  emissive: number;
  corona?: [number, number];
  name: string;
}

interface DustProp {
  type: "dust";
  position: [number, number, number];
  scale: number;
  color: string;
  size: number;
  density: number;
  name: string;
}

interface PlanetProp {
  name: string;
  type: "planet";
  position: [number, number, number];
  scale: number;
  textureSet: "ansura" | "gaia";
  atmosphere: [number, number];
}

interface Sector {
  id: string;
  name: string;
  position: number[];
  props: Array<StarProp | DustProp | PlanetProp>;
  resources: Record<string, number>;
  skybox: string;
}

interface Faction {
  id: string;
  name: string;
  slug: string;
  sectors: string[];
  blueprints: {
    ships: string[];
    facilityModules: string[];
  };
  color: string;
  type: string;
  patrols: {
    formation: {
      fighters: number;
    };
    perSector: number;
  };
  restrictions: {
    mining: boolean;
  };
  home?: string;
  mining: MiningStrategy;
}

export type Prop = StarProp | DustProp | PlanetProp;
const propSchema: JSONSchemaType<Prop> = {
  type: "object",
  required: [],
  anyOf: [
    {
      type: "object",
      properties: {
        type: { type: "string", enum: ["star"] },
        position: {
          type: "array",
          items: { type: "number" },
          minItems: 3,
          maxItems: 3,
        },
        scale: { type: "number" },
        color: { type: "string" },
        color2: { type: "string" },
        noise: { type: "number" },
        noisePower: { type: "number" },
        emissive: { type: "number" },
        corona: {
          type: "array",
          items: { type: "number" },
          minItems: 2,
          maxItems: 2,
        },
        name: { type: "string" },
      },
      required: [
        "type",
        "position",
        "scale",
        "color",
        "color2",
        "noise",
        "noisePower",
        "emissive",
        "name",
      ],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        type: { type: "string", enum: ["planet"] },
        position: {
          type: "array",
          items: { type: "number" },
          minItems: 3,
          maxItems: 3,
        },
        scale: { type: "number" },
        name: { type: "string" },
        textureSet: { type: "string", enum: ["ansura", "gaia", "none"] },
        atmosphere: {
          type: "array",
          items: { type: "number" },
          minItems: 2,
          maxItems: 2,
        },
      },
      required: [
        "type",
        "position",
        "scale",
        "name",
        "textureSet",
        "atmosphere",
      ],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        type: { type: "string", enum: ["dust"] },
        position: {
          type: "array",
          items: { type: "number" },
          minItems: 3,
          maxItems: 3,
        },
        scale: { type: "number" },
        color: { type: "string" },
        size: { type: "number" },
        density: { type: "number" },
        name: { type: "string" },
      },
      required: [
        "type",
        "position",
        "scale",
        "color",
        "size",
        "density",
        "name",
      ],
      additionalProperties: false,
    },
  ],
};

const sectorSchema: JSONSchemaType<Sector> = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    position: {
      type: "array",
      items: { type: "number" },
      minItems: 2,
      maxItems: 2,
    },
    props: {
      type: "array",
      items: propSchema,
    },
    resources: {
      type: "object",
      properties: Object.fromEntries(
        mineableCommoditiesArray.map((c) => [c, { type: "number" }])
      ),
      required: mineableCommoditiesArray,
    },
    skybox: { type: "string" },
  },
  required: ["id", "name", "position", "props", "resources", "skybox"],
};

const factionSchema: JSONSchemaType<Faction> = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    slug: { type: "string" },
    sectors: {
      type: "array",
      items: { type: "string" },
    },
    blueprints: {
      type: "object",
      properties: {
        ships: {
          type: "array",
          items: { type: "string" },
        },
        facilityModules: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["ships", "facilityModules"],
    },
    color: { type: "string" },
    type: { type: "string" },
    patrols: {
      type: "object",
      properties: {
        formation: {
          type: "object",
          properties: {
            fighters: {
              type: "integer",
            },
          },
          required: ["fighters"],
        },
        perSector: { type: "integer" },
      },
      required: ["formation", "perSector"],
    },
    restrictions: {
      type: "object",
      properties: {
        mining: { type: "boolean" },
      },
      required: ["mining"],
    },
    home: { type: "string", nullable: true },
    mining: {
      type: "string",
      enum: ["expansive", "preferOwn"],
    },
  },
  required: [
    "name",
    "slug",
    "sectors",
    "blueprints",
    "color",
    "type",
    "mining",
  ],
};

export interface MapSchema {
  sectors: Sector[];
  inactive: string[];
  links: Array<{
    sectors: string[];
    type: "accelerator" | "gate";
  }>;
  factions: Faction[];
  relations: Array<{
    factions: string[];
    value: number;
  }>;
}

const schema: JSONSchemaType<MapSchema> = {
  type: "object",
  properties: {
    sectors: {
      type: "array",
      items: sectorSchema,
    },
    inactive: { type: "array", items: { type: "string" } },
    links: {
      type: "array",
      items: {
        type: "object",
        properties: {
          sectors: {
            type: "array",
            items: { type: "string" },
            maxItems: 2,
            minItems: 2,
          },
          type: { type: "string", enum: ["accelerator", "gate"] },
        },
        required: ["sectors", "type"],
      },
    },
    factions: {
      type: "array",
      items: factionSchema,
    },
    relations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          factions: {
            type: "array",
            items: { type: "string" },
            maxItems: 2,
            minItems: 2,
          },
          value: { type: "number" },
        },
        required: ["factions", "value"],
      },
    },
  },
  required: ["sectors", "inactive", "links", "factions", "relations"],
};
const validate = ajv.compile(schema);
if (!validate(mapData)) {
  console.error(validate.errors);
  throw new Error("Map data is invalid");
}

export default mapData as MapSchema;
