type EventMap = {
  data: (data: Uint8Array) => void;
  error: (error: Error) => void;
  open: () => void;
  close: () => void;
  disconnect: () => void;
};

type EventKey = keyof EventMap;

export class PortEmitter {
  private listeners = new Map<EventKey, Set<EventMap[EventKey]>>();

  on<K extends EventKey>(event: K, listener: EventMap[K]): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  }

  emit<K extends EventKey>(
    event: K,
    ...args: Parameters<EventMap[K]>
  ): void {
    const set = this.listeners.get(event);
    if (!set) {
      return;
    }
    for (const listener of set) {
      (listener as (...params: Parameters<EventMap[K]>) => void)(...args);
    }
  }
}
