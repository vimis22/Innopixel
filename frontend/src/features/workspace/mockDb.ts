import type { WorkspaceData } from "../../types/domain";
import { createSeedData } from "./seed";

/*
 * DEVELOPMENT ONLY: a tiny "database" in localStorage so the demo survives page refreshes.
 * It is shared by the mock repository and the mock auth service.
 */

// Bump the version when the data shape changes; old demo data is then replaced by fresh seed data
const STORAGE_KEY = "innopixel.workspace.v2";

// Demo password for all mock accounts. Not a secret; it only exists in development mode.
export const DEMO_PASSWORD = "innopixel-demo";

export function readDb(): WorkspaceData {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            return JSON.parse(raw) as WorkspaceData;
        } catch {
            // Corrupt data: fall through and reseed
        }
    }
    const seed = createSeedData();
    writeDb(seed);
    return seed;
}

export function writeDb(data: WorkspaceData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetDb(): void {
    localStorage.removeItem(STORAGE_KEY);
}

// Simulated network latency, so loading states are visible and realistic
export function delay(ms = 250): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
