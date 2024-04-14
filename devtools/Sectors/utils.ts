import type { InitialSectorInput } from "@core/archetypes/sector";
import type { MineableCommodity } from "@core/economy/commodity";

export interface FormData {
  sectors: Array<
    Omit<InitialSectorInput, "position" | "slug"> & {
      id: string;
      resources: Record<MineableCommodity, number>;
    }
  >;
}
