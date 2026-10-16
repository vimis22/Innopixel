import type { Language } from "../../../context/LanguageContext";
import { fetchProjects, fetchServices } from "../../../services/publicContent";
import type { ChatbotService } from "./chatbotService";
import { answerQuestion, type SiteContent } from "./demoKnowledge";

// A short pause so an answer doesn't appear before the visitor has seen their own message
const ANSWER_DELAY_MS = 650;

function wait(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal.aborted) return reject(signal.reason);
        const timer = setTimeout(resolve, ms);
        signal.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(signal.reason);
        }, { once: true });
    });
}

/*
 * Demo mode: answers from the public website (page texts plus /api/public services and projects).
 * Nothing leaves the browser except the same public content requests the website already makes,
 * and it is clearly shown as a demo in the chat header.
 */
export function createDemoChatbotService(
    loadServices = fetchServices,
    loadProjects = fetchProjects,
    delayMs = ANSWER_DELAY_MS,
): ChatbotService {
    // One request per language; a failed load is retried on the next question
    const cache = new Map<Language, Promise<SiteContent>>();

    function contentFor(language: Language): Promise<SiteContent> {
        let pending = cache.get(language);
        if (!pending) {
            pending = Promise.all([
                loadServices(language).catch(() => null),
                loadProjects(language).catch(() => null),
            ]).then(([services, projects]) => {
                if (!services || !projects) cache.delete(language);
                return { services: services ?? [], projects: projects ?? [] };
            });
            cache.set(language, pending);
        }
        return pending;
    }

    return {
        mode: "demo",
        getAvailability: async () => "demo",
        async sendMessage(request, signal) {
            const [content] = await Promise.all([contentFor(request.language), wait(delayMs, signal)]);
            if (signal.aborted) throw signal.reason;
            return answerQuestion(request.message, request.language, content);
        },
    };
}
