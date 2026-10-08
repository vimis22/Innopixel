export type SortDirection = "asc" | "desc";

export interface SortState<K extends string> {
    key: K;
    direction: SortDirection;
}

// Clicking the active column flips the direction; another column starts ascending
export function nextSort<K extends string>(current: SortState<K>, key: K): SortState<K> {
    return current.key === key ? { key, direction: current.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" };
}
