// eslint-disable-next-line no-unused-vars
interface Window {
  sim: {
    getTime: () => number;
    pause: () => void;
    start: () => void;
    // eslint-disable-next-line no-unused-vars
    setSpeed: (value: number) => void;
    // eslint-disable-next-line no-unused-vars
    get: (id: number) => any | undefined;
    // eslint-disable-next-line no-unused-vars
    getOrThrow: (id: number) => any;
  } & Record<string, any>;
  renderer: any;
  selected: {
    id: number;
  } | null;
  dev: boolean;
}
