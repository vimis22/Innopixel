import { useEffect, useState } from "react";
import api from "./api";
import type { Language } from "../context/LanguageContext";
import type { Project } from "../types/project";
import type { Service } from "../types/service";

// Content for the public website (backend/src/Innopixel.Main/Controllers/PublicController.cs)
export async function fetchProjects(language: Language): Promise<Project[]> {
    return (await api.get<Project[]>("/public/projects", { params: { lang: language } })).data;
}

export async function fetchServices(language: Language): Promise<Service[]> {
    return (await api.get<Service[]>("/public/services", { params: { lang: language } })).data;
}

export interface ContentState<T> {
    items: T[];
    loading: boolean;
    failed: boolean;
}

// Loads content in the visitor's language and reloads when the language changes
export function usePublicContent<T>(fetcher: (language: Language) => Promise<T[]>, language: Language): ContentState<T> {
    const [state, setState] = useState<ContentState<T> & { language: Language | null }>(
        { items: [], loading: true, failed: false, language: null },
    );

    useEffect(() => {
        let cancelled = false;
        fetcher(language)
            .then((items) => {
                if (!cancelled) setState({ items, loading: false, failed: false, language });
            })
            .catch(() => {
                if (!cancelled) setState((previous) => ({ ...previous, loading: false, failed: true, language }));
            });
        return () => {
            cancelled = true;
        };
    }, [fetcher, language]);

    // While another language is loading, keep showing the previous items
    return { items: state.items, loading: state.loading || state.language !== language, failed: state.failed };
}
