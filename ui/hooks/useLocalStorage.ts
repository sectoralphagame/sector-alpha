// Source: https://usehooks.com/useLocalStorage/

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { storageHook as hook } from "@core/hooks";

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);

      return initialValue;
    }
  });

  useEffect(() => {
    const handler = (updatedKey) => {
      if (updatedKey === key) {
        const item = window.localStorage.getItem(key);
        setStoredValue(item ? JSON.parse(item) : initialValue);
      }
    };
    hook.subscribe("localStorageUpdate", handler);

    return () => hook.unsubscribe(handler);
  }, []);

  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }

      hook.notify(key);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
  };
  return [storedValue, setValue];
}
