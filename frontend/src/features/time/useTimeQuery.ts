import { useEffect, useState } from "react";

interface TimeQuery<T> {
    data: T | null;
    failed: boolean;
    retry: () => void;
}

// Loads time registration data and reloads when a dependency changes (e.g. the week shown, or the
// page's refresh counter after a clock-in). Earlier data stays visible while the next request runs.
export function useTimeQuery<T>(load: () => Promise<T>, deps: readonly unknown[]): TimeQuery<T> {
    const [data, setData] = useState<T | null>(null);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let current = true;
        load().then(
            (result) => {
                if (!current) return;
                setData(result);
                setFailed(false);
            },
            () => {
                if (current) setFailed(true);
            },
        );
        return () => {
            current = false;
        };
        // The caller lists what the request depends on
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, attempt]);

    return { data, failed, retry: () => setAttempt((a) => a + 1) };
}

// The current time, ticking every second while `live` (a running clock on screen)
export function useNow(live: boolean): number {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (!live) return;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [live]);
    return now;
}
