import { describe, expect, it } from "vitest";
import type { Project } from "../../types/project";
import type { Service } from "../../types/service";
import { ROUTES } from "../../config/routes";
import { answerQuestion, detectTopic, findMentionedProject, type SiteContent } from "./services/demoKnowledge";
import { createDemoChatbotService } from "./services/demoChatbotService";
import { safeActions } from "./services/apiChatbotService";
import { deriveAvatarState } from "./hooks/useAvatarState";
import { joinList, normalizeText, toPlainText, validateMessage, MAX_MESSAGE_LENGTH } from "./utils/chatbotHelpers";

const services: Service[] = [
    { id: "1", icon: "vr", title: "Virtual Reality (VR)", description: "Interactive 3D worlds created for Quest, Pico, and PC VR." },
    { id: "2", icon: "ar", title: "Augmented Reality (AR)", description: "Digital layers superimposed on the real world." },
    { id: "3", icon: "modeling", title: "3D Modeling & Animation", description: "High-fidelity 3D assets." },
];

function project(id: string, title: string, tags: string[], tech: string): Project {
    return { id, title, tags, intro: `<p>Intro of ${title}</p>`, body: "<p>body</p>", image: null, client: `Client ${id}`, tech };
}

const projects: Project[] = [
    project("1", "Naturpark Lillebælt AR App", ["Augmented Reality", "EduTech"], "Unity, AR Foundation"),
    project("5", "Lillebælt VR Ecosystem Game", ["Virtual Reality", "EduTech"], "Unity, Meta XR SDK"),
    project("6", "Kongernes Jelling Metaverse Exhibit", ["Metaverse", "Museum Exhibition"], "Unity, SynergyXR, VR/AR"),
];

const content: SiteContent = { services, projects };

describe("demo knowledge", () => {
    it("recognises topics in Danish and English", () => {
        expect(detectTopic("What is VR?")).toBe("vr");
        expect(detectTopic("Hvad er VR?")).toBe("vr");
        expect(detectTopic("What kind of VR solutions does Innopixel create?")).toBe("vr");
        expect(detectTopic("Hvilke ydelser tilbyder I?")).toBe("services");
        expect(detectTopic("Can I see some of your projects?")).toBe("projects");
        expect(detectTopic("Hvad koster en AR-app?")).toBe("pricing");
        expect(detectTopic("Hvordan kontakter jeg jer?")).toBe("contact");
        expect(detectTopic("What is the weather like in Paris?")).toBeNull();
    });

    it("answers from the website's services and related projects", () => {
        const reply = answerQuestion("What is VR?", "en", content);
        expect(reply.text).toContain("Virtual Reality (VR): Interactive 3D worlds");
        expect(reply.text).toContain("Lillebælt VR Ecosystem Game");
        expect(reply.text).toContain("Kongernes Jelling Metaverse Exhibit");
        expect(reply.text).not.toContain("Naturpark Lillebælt AR App");
        expect(reply.actions).toContainEqual({ kind: "navigate", label: "View projects", to: ROUTES.projects });
    });

    it("lists the services in the visitor's language", () => {
        const reply = answerQuestion("Hvilke ydelser tilbyder I?", "da", content);
        expect(reply.text).toContain("Ifølge vores hjemmeside tilbyder Innopixel");
        expect(reply.text).toContain("• Virtual Reality (VR)");
        expect(reply.text).toContain("• XR Rådgivning & Koncept");
    });

    it("describes a project the visitor names, as plain text", () => {
        expect(findMentionedProject("Tell me about the Jelling exhibit", projects)?.id).toBe("6");
        const reply = answerQuestion("Tell me about the Jelling exhibit", "en", content);
        expect(reply.text).toContain("Kongernes Jelling Metaverse Exhibit: Intro of Kongernes Jelling Metaverse Exhibit");
        expect(reply.text).not.toContain("<p>");
    });

    it("never invents prices", () => {
        const reply = answerQuestion("How much does a VR app cost?", "en", content);
        expect(reply.text).toContain("doesn't list prices");
        expect(reply.text).not.toMatch(/\d+\s?(kr|dkk|€|\$)/i);
        expect(reply.actions).toEqual([{ kind: "navigate", label: "Contact us", to: ROUTES.contact }]);
    });

    it("explains the demo's limits for unsupported questions", () => {
        const en = answerQuestion("What is the weather like in Paris?", "en", content);
        expect(en.text).toContain("demo mode");
        const da = answerQuestion("Hvem vinder Superligaen?", "da", content);
        expect(da.text).toContain("demotilstand");
        expect(da.actions.length).toBeGreaterThan(0);
    });

    it("is honest about not being a language model", () => {
        expect(answerQuestion("Are you ChatGPT?", "en", content).text).toContain("not connected to an AI language model");
    });

    it("degrades gracefully when the public content couldn't be loaded", () => {
        const reply = answerQuestion("What services do you offer?", "en", { services: [], projects: [] });
        expect(reply.text).toContain("couldn't load the list of services");
        expect(answerQuestion("Show me your projects", "en", { services: [], projects: [] }).text).toContain("couldn't load the projects");
    });

    it("only offers links to existing pages", () => {
        const pages = new Set<string>(Object.values(ROUTES));
        const questions = ["vr", "ar", "3d", "services", "projects", "process", "about", "contact", "price", "hi", "who are you", "xyz"];
        for (const q of questions) {
            for (const action of answerQuestion(q, "en", content).actions) {
                if (action.kind === "navigate") expect(pages.has(action.to)).toBe(true);
            }
        }
    });
});

describe("demo service", () => {
    it("answers with content loaded from the public API, once per language", async () => {
        let loads = 0;
        const service = createDemoChatbotService(async () => {
            loads++;
            return services;
        }, async () => projects, 0);
        const signal = new AbortController().signal;
        expect(await service.getAvailability(signal)).toBe("demo");
        const first = await service.sendMessage({ message: "What is AR?", language: "en", history: [] }, signal);
        await service.sendMessage({ message: "What is 3D modeling?", language: "en", history: [] }, signal);
        expect(first.text).toContain("Augmented Reality (AR): Digital layers");
        expect(loads).toBe(1);
    });

    it("retries loading after a failure", async () => {
        let loads = 0;
        const service = createDemoChatbotService(async () => {
            loads++;
            if (loads === 1) throw new Error("offline");
            return services;
        }, async () => projects, 0);
        const signal = new AbortController().signal;
        expect((await service.sendMessage({ message: "services", language: "en", history: [] }, signal)).text).toContain("couldn't load");
        expect((await service.sendMessage({ message: "services", language: "en", history: [] }, signal)).text).toContain("• Virtual Reality (VR)");
    });

    it("stops when the request is aborted", async () => {
        const service = createDemoChatbotService(async () => services, async () => projects, 50);
        const controller = new AbortController();
        const answer = service.sendMessage({ message: "hi", language: "en", history: [] }, controller.signal);
        controller.abort();
        await expect(answer).rejects.toBeDefined();
    });
});

describe("backend replies", () => {
    it("keeps only well-formed actions that stay on this website", () => {
        expect(safeActions([
            { kind: "navigate", label: "Projects", to: "/projekter" },
            { kind: "navigate", label: "Evil", to: "https://evil.example" },
            { kind: "navigate", label: "Protocol-relative", to: "//evil.example" },
            { kind: "ask", label: "VR?", message: "What is VR?" },
            { kind: "script", label: "x" },
            "nonsense",
        ])).toEqual([
            { kind: "navigate", label: "Projects", to: "/projekter" },
            { kind: "ask", label: "VR?", message: "What is VR?" },
        ]);
        expect(safeActions(undefined)).toEqual([]);
    });
});

describe("avatar state", () => {
    const calm = { pending: false, speaking: false, typing: false };

    it("follows the conversation in a fixed order", () => {
        expect(deriveAvatarState(calm, null)).toBe("idle");
        expect(deriveAvatarState({ ...calm, typing: true }, null)).toBe("listening");
        expect(deriveAvatarState({ ...calm, typing: true }, "greeting")).toBe("greeting");
        expect(deriveAvatarState({ ...calm, pending: true, typing: true }, "error")).toBe("thinking");
        expect(deriveAvatarState({ ...calm, speaking: true }, "greeting")).toBe("speaking");
        expect(deriveAvatarState(calm, "error")).toBe("error");
    });
});

describe("helpers", () => {
    it("validates messages", () => {
        expect(validateMessage("   ")).toEqual({ ok: false, reason: "empty" });
        expect(validateMessage("x".repeat(MAX_MESSAGE_LENGTH + 1))).toEqual({ ok: false, reason: "tooLong" });
        expect(validateMessage("  Hej  ")).toEqual({ ok: true, message: "Hej" });
    });

    it("normalizes text and strips HTML", () => {
        expect(normalizeText("Hvad er VR/AR?")).toBe(" hvad er vr ar ");
        expect(toPlainText("<h4>Title</h4><p>A &amp; B</p>")).toBe("Title A & B");
        expect(joinList(["a", "b", "c"], "da")).toBe("a, b og c");
    });
});
