import throttle from "lodash/throttle";
import { useCallback, useEffect, useState } from "react";
import { useWatch } from "react-hook-form";

export function useThrottledFormState<T>(name?: string): T {
  const data: T = useWatch(name ? { name } : undefined!);
  const [display, setDisplay] = useState<T>(data);
  const refreshDisplay = useCallback(throttle(setDisplay, 500), []);

  useEffect(() => {
    refreshDisplay(data);
  }, [data]);

  return display!;
}

export const formatInt = Intl.NumberFormat(window.navigator.language, {
  maximumFractionDigits: 0,
  compactDisplay: "short",
}).format;
