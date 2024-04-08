type ObserverFn<T> = (_value: T) => void;

type Observer<T> = {
  fn: ObserverFn<T>;
  origin: string;
};

export class Observable<T> {
  /**
   * If true, the observer will add a error boundary to the observer calls
   */
  boundary: boolean;
  name: string;
  observers: Observer<T>[];
  value: T;

  constructor(name: string, boundary = true) {
    this.name = name;
    this.boundary = boundary;
    this.observers = [];
  }

  subscribe = (origin: string, fn: ObserverFn<T>) => {
    this.observers.push({
      fn,
      origin,
    });
    if (this.value) fn(this.value);
  };

  unsubscribe = (f: ObserverFn<T>) => {
    this.observers = this.observers.filter((subscriber) => subscriber.fn !== f);
  };

  notify: ObserverFn<T> = (data) => {
    this.value = data;
    this.observers.forEach((observer) => {
      if (this.boundary) {
        try {
          observer.fn(data);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(
            `Error in observer ${this.name} calling for ${observer.origin}`
          );
          throw err;
        }
      } else {
        observer.fn(data);
      }
    });
  };
}
