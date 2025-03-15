import type { RequireComponent } from "./tsHelpers";
import { Observable } from "./utils/observer";

export const storageHook = new Observable<string>("storage");
export const teleportHook = new Observable<{
  prevSectorId: number;
  sectorId: number;
  entity: RequireComponent<"position">;
}>("teleport");
