import { reaction, isObservable } from "mobx";
import { useEffect, useState } from "react";

export function useMobx<T extends object, TResult>(
  store: T,
  selector: (_store: T) => TResult
): [TResult, T] {
  const [data, setData] = useState<TResult>(selector(store));

  useEffect(() => {
    if (!isObservable(store)) {
      console.warn(
        "The store is not observable. Make sure it is properly marked as observable."
      );
    }

    const disposer = reaction(() => selector(store), setData);

    return disposer;
  }, [store, selector]);

  return [data, store];
}
