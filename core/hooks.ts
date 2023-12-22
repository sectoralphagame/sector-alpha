import { SyncHook } from "tapable";

export const storageHook = new SyncHook<string>(["localStorageUpdate"]);
