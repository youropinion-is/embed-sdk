/**
 * Minimal typed event emitter used by widget and modal handles.
 */

type Listener = (...args: any[]) => void;

export interface Emitter<EventMap extends object> {
    on<K extends keyof EventMap>(event: K, callback: (payload: EventMap[K]) => void): void;
    off<K extends keyof EventMap>(event: K, callback: (payload: EventMap[K]) => void): void;
    emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void;
    clear(): void;
}

export function createEmitter<EventMap extends object>(): Emitter<EventMap> {
    const listeners = new Map<keyof EventMap, Set<Listener>>();

    return {
        on(event, callback) {
            let set = listeners.get(event);
            if (!set) {
                set = new Set();
                listeners.set(event, set);
            }
            set.add(callback as Listener);
        },
        off(event, callback) {
            listeners.get(event)?.delete(callback as Listener);
        },
        emit(event, payload) {
            const set = listeners.get(event);
            if (set) {
                for (const fn of set) {
                    try {
                        fn(payload);
                    } catch (e) {
                        console.error("[yo-embed]", e);
                    }
                }
            }
        },
        clear() {
            listeners.clear();
        },
    };
}
