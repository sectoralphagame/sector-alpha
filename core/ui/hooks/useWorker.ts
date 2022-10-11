import { MutableRefObject, useEffect, useRef } from "react";

export function useWorker(
  workerFn: () => Worker,
  // eslint-disable-next-line no-unused-vars
  onRegister?: (worker: Worker) => void
): MutableRefObject<Worker | undefined> {
  const workerRef = useRef<Worker>();

  useEffect(() => {
    workerRef.current = workerFn();

    if (onRegister) {
      onRegister(workerRef.current);
    }

    return () => workerRef.current?.terminate();
  }, []);

  return workerRef;
}
