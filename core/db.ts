import { openDB, DBSchema } from "idb";

export interface Save {
  id?: number;
  name: string;
  data: string;
}

interface DB extends DBSchema {
  saves: {
    key: number;
    value: Save;
  };
}

export async function openDb() {
  return openDB<DB>("default", 1, {
    upgrade: (db) =>
      db.createObjectStore("saves", { keyPath: "id", autoIncrement: true }),
  });
}
