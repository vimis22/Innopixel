import type { Language } from "../../../context/LanguageContext";
import type { Project } from "../../../types/project";
import type { Service } from "../../../types/service";
import { ROUTES } from "../../../config/routes";
import translations from "../../../i18n/translations.json";
import type { ChatAction, ChatReply } from "../types/chatbot.types";
import { joinList, normalizeText, toPlainText } from "../utils/chatbotHelpers";

/*
 * The demo assistant's knowledge. It only answers from what the public website already says:
 * the page texts in translations.json and the services and projects from /api/public.
 * It never makes up prices, customers or projects; anything else gets an honest "I can't answer that".
 */

export interface SiteContent {
    services: Service[];
    projects: Project[];
}

type Topic =
    | "vr" | "ar" | "modeling" | "web" | "edutech" | "consulting"
    | "services" | "projects" | "process" | "about" | "contact" | "pricing"
    | "assistant" | "greeting" | "thanks";

// Words and phrases (normalized, matched as whole words) that point to a topic. Both languages always count,
// so a Danish visitor writing in English still gets an answer.
const KEYWORDS: Record<Topic, string[]> = {
    vr: ["vr", "virtual reality", "virtuel virkelighed", "virtual", "virtuel", "quest", "pico", "headset", "vr briller"],
    ar: ["ar", "augmented reality", "augmented", "udvidet virkelighed", "hololens", "ar briller"],
    modeling: ["3d", "3d model", "3d modeling", "3d modelling", "modellering", "modeling", "modelling", "animation", "blender", "3d print"],
    web: ["web", "webgl", "webxr", "browser", "web oplevelse", "web experience", "three js"],
    edutech: ["edutech", "learning", "læring", "education", "educational", "undervisning", "skole", "school", "gamification", "læringsspil", "games", "game", "spil"],
    consulting: ["consulting", "rådgivning", "konsulent", "consultant", "strategi", "strategy", "koncept", "concept", "feasibility", "sparring"],
    services: ["service", "services", "ydelse", "ydelser", "tilbyder", "offer", "solutions", "løsninger", "what do you do", "hvad laver i", "kan i lave", "can you make"],
    projects: ["project", "projects", "projekt", "projekter", "case", "cases", "portfolio", "eksempler", "examples", "clients", "kunder", "references", "referencer"],
    process: ["process", "proces", "how do you work", "hvordan arbejder i", "workflow", "forløb", "steps", "trin", "timeline", "tidsplan"],
    about: ["about", "om jer", "who are you guys", "hvem er i", "story", "historie", "history", "company", "virksomhed", "founded", "grundlagt", "studio", "studie", "philosophy", "filosofi"],
    contact: ["contact", "kontakt", "email", "e mail", "mail", "phone", "telefon", "address", "adresse", "where are you", "hvor ligger", "located", "meeting", "møde", "book", "cvr", "reach", "fat i"],
    pricing: ["price", "prices", "pricing", "pris", "priser", "cost", "costs", "koster", "quote", "tilbud", "budget", "expensive", "dyrt"],
    assistant: ["who are you", "hvem er du", "what are you", "hvad er du", "are you ai", "er du ai", "er du en ai", "chatgpt", "robot", "bot", "demo", "language model", "sprogmodel"],
    greeting: ["hi", "hello", "hey", "hej", "hejsa", "goddag", "davs", "halløj", "good morning", "godmorgen"],
    thanks: ["thanks", "thank you", "thank", "tak", "mange tak", "tusind tak"],
};

// When two topics match equally well, the earlier one wins (specific before general, small talk last)
const PRIORITY: Topic[] = [
    "pricing", "vr", "ar", "modeling", "web", "edutech", "consulting", "contact", "process",
    "projects", "services", "about", "assistant", "thanks", "greeting",
];

// Service icons in /api/public/services that belong to a topic, and project tags/technologies that relate to it
const SERVICE_ICON: Partial<Record<Topic, string>> = { vr: "vr", ar: "ar", modeling: "modeling", web: "web" };
const PROJECT_HINTS: Partial<Record<Topic, string[]>> = {
    vr: ["virtual reality", "vr", "metaverse", "extended reality"],
    ar: ["augmented reality", "ar", "extended reality", "hololens"],
    modeling: ["3d"],
    web: ["web", "webgl", "webxr", "three js"],
    edutech: ["edutech", "gamification"],
};

const CONTACT_EMAIL = "hello@innopixel.dk";      // as on the contact page
const COMPANY_LINE = "Innopixel ApS · CVR 38861840 · Odense NV";

function phrases(language: Language) {
    const site = translations[language];
    const da = language === "da";
    return {
        site,
        actions: {
            services: { kind: "navigate", label: site.nav.services, to: ROUTES.services } satisfies ChatAction,
            projects: { kind: "navigate", label: da ? "Se projekter" : "View projects", to: ROUTES.projects } satisfies ChatAction,
            contact: { kind: "navigate", label: da ? "Kontakt os" : "Contact us", to: ROUTES.contact } satisfies ChatAction,
            story: { kind: "navigate", label: site.nav.story, to: ROUTES.story } satisfies ChatAction,
            askServices: { kind: "ask", label: da ? "Vores ydelser" : "Our services", message: da ? "Hvilke ydelser tilbyder I?" : "What services do you offer?" } satisfies ChatAction,
            askProcess: { kind: "ask", label: da ? "Hvordan arbejder I?" : "How do you work?", message: da ? "Hvordan arbejder I?" : "How do you work?" } satisfies ChatAction,
            askVr: { kind: "ask", label: da ? "Hvad er VR?" : "What is VR?", message: da ? "Hvad er VR?" : "What is VR?" } satisfies ChatAction,
        },
        // General explanations of the technologies (not claims about Innopixel)
        definitions: {
            vr: da
                ? "Virtual Reality (VR) er en fuldt digital 3D-verden, som man oplever gennem et VR-headset og kan bevæge sig rundt i og interagere med."
                : "Virtual Reality (VR) is a fully digital 3D world that you experience through a VR headset and can move around in and interact with.",
            ar: da
                ? "Augmented Reality (AR) lægger digitalt indhold oven på den virkelige verden, fx gennem en smartphone, en tablet eller AR-briller."
                : "Augmented Reality (AR) places digital content on top of the real world, for example through a smartphone, a tablet or AR glasses.",
            modeling: da
                ? "3D-modellering er arbejdet med at skabe digitale tredimensionelle objekter og miljøer, som kan bruges i fx VR, AR, web og animation."
                : "3D modeling is the craft of creating digital three-dimensional objects and environments that can be used in VR, AR, the web and animation.",
            web: da
                ? "Interaktive web-oplevelser er 3D- og XR-indhold, der kører direkte i browseren uden at skulle installere en app."
                : "Interactive web experiences are 3D and XR content that runs directly in the browser, without installing an app.",
        } as Partial<Record<Topic, string>>,
        relatedProjects: (names: string[]) => (da ? `Relaterede projekter på hjemmesiden: ${joinList(names, language)}.` : `Related projects on the website: ${joinList(names, language)}.`),
        wantMore: da ? "Vil du se projekterne eller tale med os om dit eget projekt?" : "Would you like to see the projects or talk to us about your own project?",
        servicesIntro: da ? "Ifølge vores hjemmeside tilbyder Innopixel:" : "According to our website, Innopixel offers:",
        servicesUnavailable: da
            ? "Jeg kunne ikke hente listen over ydelser lige nu, men du kan altid se dem på siden Ydelser."
            : "I couldn't load the list of services right now, but you can always see them on the Services page.",
        projectsIntro: (n: number) => (da ? `Vi har ${n} projekter på hjemmesiden, bl.a.:` : `There are ${n} projects on the website, including:`),
        projectsUnavailable: da
            ? "Jeg kunne ikke hente projekterne lige nu. Du kan se dem alle på siden Projekter."
            : "I couldn't load the projects right now. You can see all of them on the Projects page.",
        projectClient: da ? "Kunde" : "Client",
        projectTech: da ? "Teknologi" : "Technology",
        processIntro: da ? "Sådan arbejder vi:" : "This is how we work:",
        contact: da
            ? `Du kan skrive til os på ${CONTACT_EMAIL} eller bruge kontaktformularen. Vores studie ligger i Odense. ${COMPANY_LINE}.`
            : `You can email us at ${CONTACT_EMAIL} or use the contact form. Our studio is in Odense, Denmark. ${COMPANY_LINE}.`,
        pricing: da
            ? "Vores hjemmeside oplyser ikke priser, fordi hvert projekt bliver skræddersyet. Skriv til os via kontaktformularen, så kan vi give dig et tilbud på netop dit projekt."
            : "Our website doesn't list prices, because every project is tailored. Get in touch through the contact form and we can give you a quote for your project.",
        assistant: da
            ? "Jeg er Innopixels assistent i demotilstand. Jeg er endnu ikke forbundet til en AI-sprogmodel, så jeg svarer kun ud fra indholdet på denne hjemmeside: vores ydelser, projekter, arbejdsproces og kontaktoplysninger."
            : "I'm Innopixel's assistant in demo mode. I'm not connected to an AI language model yet, so I only answer from the content of this website: our services, projects, process and contact details.",
        greeting: da ? "Hej! Hvad vil du gerne vide om Innopixel?" : "Hi! What would you like to know about Innopixel?",
        thanks: da ? "Det var så lidt! Er der andet, jeg kan hjælpe med?" : "You're welcome! Is there anything else I can help with?",
        fallback: da
            ? "Det kan jeg desværre ikke svare på. Jeg kører i demotilstand og kan kun hjælpe med spørgsmål om Innopixels ydelser, projekter, arbejdsproces og kontaktoplysninger. Prøv et af forslagene nedenfor, eller kontakt os direkte."
            : "Sorry, I can't answer that. I'm running in demo mode and can only help with questions about Innopixel's services, projects, process and contact details. Try one of the suggestions below, or contact us directly.",
    };
}

// Whole words; longer words also as the start of a word, so Danish endings match ("kontakt" in "kontakter")
function containsPhrase(normalized: string, phrase: string): boolean {
    return normalized.includes(` ${phrase} `) || (phrase.length >= 5 && normalized.includes(` ${phrase}`));
}

export function detectTopic(message: string): Topic | null {
    const normalized = normalizeText(message);
    let best: { topic: Topic; score: number } | null = null;
    for (const topic of PRIORITY) {
        const score = KEYWORDS[topic].filter((phrase) => containsPhrase(normalized, phrase)).length;
        if (score > 0 && (!best || score > best.score)) best = { topic, score };
    }
    return best?.topic ?? null;
}

// A project the visitor names, e.g. "Tell me about the Jelling exhibit": a distinctive word of its title
export function findMentionedProject(message: string, projects: Project[]): Project | null {
    const normalized = normalizeText(message);
    const generic = new Set(["project", "projekt", "app", "game", "guide", "exhibit", "exhibition", "udstilling", "the", "and"]);
    let best: { project: Project; score: number } | null = null;
    for (const project of projects) {
        const words = normalizeText(project.title).trim().split(" ").filter((w) => w.length >= 4 && !generic.has(w));
        const score = words.filter((w) => containsPhrase(normalized, w)).length;
        if (score > 0 && (!best || score > best.score)) best = { project, score };
    }
    return best?.project ?? null;
}

function projectsRelatedTo(topic: Topic, projects: Project[]): Project[] {
    const hints = PROJECT_HINTS[topic];
    if (!hints) return [];
    return projects.filter((p) => {
        const haystack = normalizeText(`${p.tags.join(" ")} ${p.tech}`);
        return hints.some((hint) => containsPhrase(haystack, hint));
    });
}

export function answerQuestion(message: string, language: Language, content: SiteContent): ChatReply {
    const p = phrases(language);
    const { site, actions } = p;

    const mentioned = findMentionedProject(message, content.projects);
    if (mentioned) {
        return {
            text: [
                `${mentioned.title}: ${toPlainText(mentioned.intro)}`,
                `${p.projectClient}: ${mentioned.client}. ${p.projectTech}: ${mentioned.tech}.`,
            ].join("\n\n"),
            actions: [actions.projects, actions.contact],
        };
    }

    const topic = detectTopic(message);
    switch (topic) {
        case "vr":
        case "ar":
        case "modeling":
        case "web": {
            const service = content.services.find((s) => s.icon === SERVICE_ICON[topic]);
            const related = projectsRelatedTo(topic, content.projects).map((pr) => pr.title).slice(0, 3);
            const parts = [p.definitions[topic] ?? ""];
            if (service) parts.push(`${service.title}: ${toPlainText(service.description)}`);
            if (related.length) parts.push(p.relatedProjects(related));
            parts.push(p.wantMore);
            return { text: parts.filter(Boolean).join("\n\n"), actions: [actions.projects, actions.contact] };
        }
        case "edutech":
        case "consulting": {
            const page = site.servicesPage;
            const [title, description] = topic === "edutech" ? [page.edutechTitle, page.edutechDesc] : [page.consultingTitle, page.consultingDesc];
            const related = projectsRelatedTo(topic, content.projects).map((pr) => pr.title).slice(0, 3);
            const parts = [`${title}: ${description}`];
            if (related.length) parts.push(p.relatedProjects(related));
            return { text: parts.join("\n\n"), actions: [actions.services, actions.contact] };
        }
        case "services": {
            const names = [...content.services.map((s) => s.title), site.servicesPage.edutechTitle, site.servicesPage.consultingTitle];
            const text = content.services.length
                ? `${p.servicesIntro}\n${names.map((n) => `• ${n}`).join("\n")}\n\n${site.servicesPage.bannerDesc}`
                : p.servicesUnavailable;
            return { text, actions: [actions.services, actions.askProcess, actions.askVr] };
        }
        case "projects": {
            if (!content.projects.length) return { text: p.projectsUnavailable, actions: [actions.projects] };
            const list = content.projects.slice(0, 4).map((pr) => `• ${pr.title} (${pr.client})`).join("\n");
            return { text: `${p.projectsIntro(content.projects.length)}\n${list}`, actions: [actions.projects, actions.contact] };
        }
        case "process": {
            const page = site.servicesPage;
            const steps = [
                `${page.step1Title}: ${page.step1Desc}`,
                `${page.step2Title}: ${page.step2Desc}`,
                `${page.step3Title}: ${page.step3Desc}`,
                `${page.step4Title}: ${page.step4Desc}`,
            ];
            return { text: `${p.processIntro}\n${steps.join("\n")}`, actions: [actions.services, actions.contact] };
        }
        case "about": {
            const story = site.storyPage;
            return { text: [story.pHandcraft1, story.pPhilosophy, story.pStudio].join("\n\n"), actions: [actions.story, actions.projects] };
        }
        case "contact":
            return { text: p.contact, actions: [actions.contact] };
        case "pricing":
            return { text: p.pricing, actions: [actions.contact] };
        case "assistant":
            return { text: p.assistant, actions: [actions.askServices, actions.projects] };
        case "thanks":
            return { text: p.thanks, actions: [] };
        case "greeting":
            return { text: p.greeting, actions: [actions.askServices, actions.projects, actions.askVr] };
        default:
            return { text: p.fallback, actions: [actions.askServices, actions.projects, actions.contact] };
    }
}
