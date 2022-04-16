interface Window {
  sim: {
    getTime: () => number;
    pause: () => void;
    start: () => void;
    // eslint-disable-next-line no-unused-vars
    setSpeed: (value: number) => void;
  };
  renderer: any;
  selected: {
    focus: () => void;
  };
}
