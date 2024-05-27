import type { BaseComponent } from "./component";

export interface StorageTransfer extends BaseComponent<"storageTransfer"> {
  amount: number;
  transferred: number;
  targetId: number;
}
