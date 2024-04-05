import type { Observable } from "@core/utils/observer";
import { useEffect, useState } from "react";

export function useObservable<T>(
  observable: Observable<T>
): [T, (_value: T) => void] {
  const [value, setValue] = useState<T>(observable.value);

  useEffect(() => {
    const set = (v: T) => setValue(v);
    observable.subscribe("useObservable", set);

    return () => observable.unsubscribe(set);
  }, []);

  return [value, observable.notify as (_value: T) => void];
}
