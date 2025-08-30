import throttle from "lodash/throttle";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWatch } from "react-hook-form";
import { useLocation, useNavigate } from "react-router";

export function useThrottledFormState<T>(name?: string): T {
  const data: T = useWatch(name ? { name } : undefined!);
  const [display, setDisplay] = useState<T>(data);
  const refreshDisplay = useCallback(throttle(setDisplay, 200), []);

  useEffect(() => {
    refreshDisplay(data);
  }, [data]);

  return display!;
}

export const formatInt = Intl.NumberFormat(window.navigator.language, {
  maximumFractionDigits: 0,
  compactDisplay: "short",
}).format;

export function useQs() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const set = useCallback(
    (searchParams: URLSearchParams) => {
      navigate({
        search: searchParams.toString(),
      });
    },
    [navigate]
  );

  return { params, set };
}
