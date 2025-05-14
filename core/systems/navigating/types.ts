import type { RequireComponent } from "@core/tsHelpers";
import type { Driveable } from "@core/utils/moving";

export type Navigable = Driveable & RequireComponent<"position">;
