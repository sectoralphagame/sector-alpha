export type EventHandler<T extends { type: string }> = (_data: T) => void;

export class PubSub<T extends { type: string }> {
  private subscribers: Map<string, Set<EventHandler<T>>> = new Map();

  subscribe<TType extends T["type"]>(
    event: TType,
    callback: (_data: T extends { type: TType } ? T : never) => void
  ): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)?.add(callback);
    return () => {
      this.unsubscribe(event, callback);
    };
  }

  unsubscribe(event: string, callback: EventHandler<T>): void {
    this.subscribers.get(event)?.delete(callback);
  }

  publish<TType extends T["type"]>(
    data: T extends { type: TType } ? T : never
  ): void {
    this.subscribers.get(data.type)?.forEach((callback) => callback(data));
  }

  reset(): void {
    this.subscribers.clear();
  }
}
