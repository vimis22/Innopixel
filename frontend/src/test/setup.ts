import { beforeEach } from "vitest";

// Minimal in-memory localStorage, so the mock repository and auth service run under Node
class MemoryStorage {
    private store = new Map<string, string>();
    get length() { return this.store.size; }
    clear() { this.store.clear(); }
    getItem(key: string) { return this.store.get(key) ?? null; }
    key(index: number) { return [...this.store.keys()][index] ?? null; }
    removeItem(key: string) { this.store.delete(key); }
    setItem(key: string, value: string) { this.store.set(key, String(value)); }
}

Object.defineProperty(globalThis, "localStorage", { value: new MemoryStorage(), configurable: true });

beforeEach(() => localStorage.clear());
