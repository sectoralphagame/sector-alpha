import { Observable } from "@core/utils/observer";
import type { ContextMenu } from "@ui/components/ContextMenu/types";
import { useObservable } from "@ui/hooks/useObservable";

export const contextMenuObservable = new Observable<ContextMenu>("contextMenu");
contextMenuObservable.value = {
  active: false,
  position: [0, 0],
  worldPosition: [0, 0],
  sector: null,
};
export const useContextMenu = () => useObservable(contextMenuObservable);
export type ContextMenuApi = ReturnType<typeof useObservable<ContextMenu>>;
