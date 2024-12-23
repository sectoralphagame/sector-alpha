import type { Sector } from "@core/archetypes/sector";
import { Observable } from "@core/utils/observer";
import { useObservable } from "@ui/hooks/useObservable";

export const sectorObservable = new Observable<Sector>("sector");
export const useSectorObservable = () => useObservable(sectorObservable);
