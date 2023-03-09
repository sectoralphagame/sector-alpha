// Source: https://usehooks.com/useLocalStorage/

import type { Dispatch } from "react";
import { useState } from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, Dispatch<T>] {
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

  const setValue = (value: T) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
  };
  return [storedValue, setValue];
}
