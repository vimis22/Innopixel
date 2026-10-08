import type {
    ActivityLog, Milestone, Project, ProjectMember, ProjectStatus, ProjectStatusHistory,
    Task, TaskDependency, TaskPriority, TaskStatus, User, WorkspaceData,
} from "../../types/domain";
import { addDays, todayISO } from "../../utils/date";

/*
 * Development-only demo data for an XR production company.
 * Dates are relative to the day the demo database is created, so the demo always has
 * finished, ongoing, overdue and upcoming work.
 */

interface TaskSpec {
    id: string;
    group: string;
    title: string;
    assignee: string | null;
    start: number;        // days from today
    days: number;         // duration
    status: TaskStatus;
    progress?: number;
    hours?: number;
    priority?: TaskPriority;
    milestone?: string;
    after?: string[];     // predecessor task ids
    description?: string;
    checklist?: [string, boolean][];
}

interface ProjectSpec {
    id: string;
    name: string;
    description: string;
    client: string;
    image: string;
    manager: string;
    status: ProjectStatus;
    start: number;
    end: number;
    members: string[];
    previousStatus?: ProjectStatus;
    milestones: { id: string; title: string; due: number; description: string; manualDone?: boolean }[];
    tasks: TaskSpec[];
}

const users: Omit<User, "createdAt">[] = [
    { id: "u-mette", name: "Mette Lindholm", email: "mette@innopixel.dk", role: "ADMIN", title: "Producer & partner", department: "Ledelse", phone: "+45 60 12 34 56", active: true },
    { id: "u-mikkel", name: "Mikkel Thomsen", email: "mikkel@innopixel.dk", role: "ADMIN", title: "Teknisk direktør", department: "Ledelse", phone: "+45 60 22 41 18", active: true },
    { id: "u-jonas", name: "Jonas Kjær", email: "jonas@innopixel.dk", role: "EMPLOYEE", title: "Unity-udvikler", department: "Udvikling", phone: "+45 31 44 82 10", active: true },
    { id: "u-sofie", name: "Sofie Andersen", email: "sofie@innopixel.dk", role: "EMPLOYEE", title: "3D-artist", department: "Produktion", phone: null, active: true },
    { id: "u-ahmad", name: "Ahmad Rahimi", email: "ahmad@innopixel.dk", role: "EMPLOYEE", title: "XR-udvikler", department: "Udvikling", phone: "+45 28 90 15 63", active: true },
    { id: "u-laura", name: "Laura Holm", email: "laura@innopixel.dk", role: "EMPLOYEE", title: "UX-designer", department: "Design", phone: null, active: true },
    { id: "u-emil", name: "Emil Nørgaard", email: "emil@innopixel.dk", role: "EMPLOYEE", title: "Lyddesigner", department: "Produktion", phone: "+45 42 17 66 09", active: true },
];

const projects: ProjectSpec[] = [
    {
        id: "p-vr-training",
        name: "VR-træning: Offshore sikkerhed",
        description: "VR-træningsapplikation til Meta Quest 3, hvor vindmølleteknikere træner nødprocedurer og sikker brug af værktøj i en realistisk nacelle, før de sendes offshore.",
        client: "Nordsø Vind A/S",
        image: "/images/project_turbine.png",
        manager: "u-mette",
        status: "ACTIVE",
        start: -56,
        end: 49,
        members: ["u-mette", "u-jonas", "u-sofie", "u-emil", "u-laura"],
        milestones: [
            { id: "m-vr-concept", title: "Koncept godkendt", due: -36, description: "Kunden godkender storyboard og træningsscenarier." },
            { id: "m-vr-prototype", title: "Interaktiv prototype", due: 3, description: "Spilbar prototype med nacelle og grundlæggende interaktion." },
            { id: "m-vr-beta", title: "Beta-version", due: 32, description: "Alle scenarier spilbare, klar til brugertest." },
            { id: "m-vr-delivery", title: "Endelig levering", due: 49, description: "Levering til kundens Quest-flåde og onboarding af instruktører." },
        ],
        tasks: [
            { id: "t-vr-1", group: "Koncept", title: "Behovsanalyse og workshops med kunden", assignee: "u-laura", start: -56, days: 9, status: "DONE", hours: 24, milestone: "m-vr-concept" },
            { id: "t-vr-2", group: "Koncept", title: "Storyboard for træningsscenarier", assignee: "u-laura", start: -46, days: 10, status: "DONE", hours: 32, milestone: "m-vr-concept", after: ["t-vr-1"] },
            { id: "t-vr-3", group: "Design", title: "3D-modellering af vindmøllenacelle", assignee: "u-sofie", start: -35, days: 32, status: "IN_REVIEW", progress: 90, hours: 80, priority: "HIGH", milestone: "m-vr-prototype", after: ["t-vr-2"], checklist: [["Modellering af nacelle og tårn", true], ["UV-unwrap og teksturer", true], ["LOD-niveauer til Quest", true], ["Optimér draw calls", false], ["Godkendelse hos kunden", false]] },
            { id: "t-vr-4", group: "Design", title: "Lyddesign og spatial audio", assignee: "u-emil", start: -20, days: 30, status: "IN_PROGRESS", progress: 45, hours: 40, milestone: "m-vr-beta" },
            { id: "t-vr-5", group: "Udvikling", title: "Interaktionssystem: greb og værktøjer", assignee: "u-jonas", start: -33, days: 34, status: "IN_PROGRESS", progress: 75, hours: 90, priority: "HIGH", milestone: "m-vr-prototype", after: ["t-vr-2"], description: "Fysikbaseret greb, værktøjsbælte og haptisk feedback til Quest-controllere.", checklist: [["Greb og slip med fysik", true], ["Værktøjsbælte", true], ["Haptisk feedback", false], ["Test med venstrehåndede brugere", false]] },
            { id: "t-vr-6", group: "Udvikling", title: "Scenarie: Nødevakuering", assignee: "u-jonas", start: 2, days: 20, status: "TODO", hours: 60, milestone: "m-vr-beta", after: ["t-vr-5"] },
            { id: "t-vr-7", group: "Udvikling", title: "Scoring og træningsrapport", assignee: "u-jonas", start: 22, days: 9, status: "TODO", hours: 30, priority: "LOW", milestone: "m-vr-beta", after: ["t-vr-6"] },
            { id: "t-vr-8", group: "Test & levering", title: "Brugertest med teknikere", assignee: "u-laura", start: 32, days: 8, status: "TODO", hours: 24, milestone: "m-vr-delivery", after: ["t-vr-7"] },
            { id: "t-vr-9", group: "Test & levering", title: "Optimering til Meta Quest 3 (72 fps)", assignee: "u-jonas", start: 33, days: 12, status: "TODO", hours: 32, priority: "HIGH", milestone: "m-vr-delivery", after: ["t-vr-7"] },
            { id: "t-vr-10", group: "Test & levering", title: "Levering og onboarding af instruktører", assignee: "u-mette", start: 46, days: 3, status: "TODO", hours: 8, milestone: "m-vr-delivery", after: ["t-vr-8", "t-vr-9"] },
        ],
    },
    {
        id: "p-ar-furniture",
        name: "AR-produktvisualisering",
        description: "AR-app hvor kunder kan placere møbler i fuld størrelse i deres eget hjem, skifte materialer og købe direkte via webshoppen.",
        client: "Nordisk Møbeldesign",
        image: "/images/stock_ar_service.png",
        manager: "u-ahmad",
        status: "ACTIVE",
        start: -28,
        end: 42,
        members: ["u-ahmad", "u-sofie", "u-laura", "u-jonas"],
        milestones: [
            { id: "m-ar-prototype", title: "Første AR-prototype", due: 5, description: "Placering af tre møbler i rummet med korrekt skala." },
            { id: "m-ar-launch", title: "Lancering i app stores", due: 42, description: "Appen er godkendt og udgivet på iOS og Android." },
        ],
        tasks: [
            { id: "t-ar-1", group: "Koncept", title: "Afklaring af produktkatalog og formater", assignee: "u-ahmad", start: -28, days: 6, status: "DONE", hours: 16 },
            { id: "t-ar-2", group: "Koncept", title: "UX-flow for placering i rummet", assignee: "u-laura", start: -22, days: 10, status: "DONE", hours: 24, after: ["t-ar-1"] },
            { id: "t-ar-3", group: "Koncept", title: "Brugertest af papirprototype", assignee: "u-laura", start: -11, days: 6, status: "IN_PROGRESS", progress: 60, hours: 12, priority: "HIGH", after: ["t-ar-2"] },
            { id: "t-ar-4", group: "3D-produktion", title: "Fotogrammetri af 12 møbler", assignee: "u-sofie", start: -18, days: 22, status: "IN_PROGRESS", progress: 70, hours: 60, milestone: "m-ar-prototype" },
            { id: "t-ar-5", group: "3D-produktion", title: "Optimering af modeller (LOD og teksturer)", assignee: "u-sofie", start: 4, days: 14, status: "TODO", hours: 40, after: ["t-ar-4"] },
            { id: "t-ar-6", group: "Udvikling", title: "AR Foundation: plane detection og placering", assignee: "u-ahmad", start: -14, days: 18, status: "IN_PROGRESS", progress: 65, hours: 48, priority: "HIGH", milestone: "m-ar-prototype", after: ["t-ar-1"], checklist: [["Plane detection på iOS", true], ["Plane detection på Android", true], ["Skalering 1:1", false], ["Skygger under møbler", false]] },
            { id: "t-ar-7", group: "Udvikling", title: "Materialevælger og farvevarianter", assignee: "u-jonas", start: -6, days: 16, status: "IN_PROGRESS", progress: 25, hours: 36 },
            { id: "t-ar-8", group: "Udvikling", title: "Integration med webshop-API", assignee: "u-ahmad", start: 10, days: 16, status: "TODO", hours: 40, priority: "HIGH", after: ["t-ar-6"] },
            { id: "t-ar-9", group: "Lancering", title: "App Store- og Google Play-udgivelse", assignee: "u-ahmad", start: 33, days: 9, status: "TODO", hours: 16, milestone: "m-ar-launch", after: ["t-ar-8", "t-ar-5"] },
        ],
    },
    {
        id: "p-museum",
        name: "Interaktiv museumsoplevelse: Vikingetiden",
        description: "Udstilling med touch-installation, NFC-figurer og en fælles multiplayer-oplevelse, hvor skoleklasser udforsker en vikingelandsby.",
        client: "Sydjysk Kulturmuseum",
        image: "/images/project_jelling.png",
        manager: "u-mette",
        status: "ACTIVE",
        start: -95,
        end: 12,
        members: ["u-mette", "u-sofie", "u-emil", "u-jonas", "u-ahmad", "u-laura"],
        milestones: [
            { id: "m-mu-research", title: "Manuskript godkendt", due: -66, description: "Museets formidlere godkender manuskript og fortællestruktur." },
            { id: "m-mu-content", title: "Indhold færdigproduceret", due: -5, description: "Alle 3D-miljøer, karakterer og lyd er klar til installation." },
            { id: "m-mu-opening", title: "Udstillingsåbning", due: 12, description: "Officiel åbning af udstillingen for offentligheden." },
        ],
        tasks: [
            { id: "t-mu-1", group: "Research", title: "Faglig research med museets formidlere", assignee: "u-mette", start: -95, days: 14, status: "DONE", hours: 30, milestone: "m-mu-research" },
            { id: "t-mu-2", group: "Research", title: "Manuskript og fortællestruktur", assignee: "u-laura", start: -81, days: 15, status: "DONE", hours: 40, milestone: "m-mu-research", after: ["t-mu-1"] },
            { id: "t-mu-3", group: "Produktion", title: "Karaktermodeller med motion capture", assignee: "u-sofie", start: -66, days: 30, status: "DONE", hours: 120, after: ["t-mu-2"] },
            { id: "t-mu-4", group: "Produktion", title: "Miljø: vikingelandsby i Unity", assignee: "u-sofie", start: -40, days: 34, status: "IN_REVIEW", progress: 95, hours: 100, milestone: "m-mu-content" },
            { id: "t-mu-5", group: "Produktion", title: "Fortællerstemme og lydlandskab", assignee: "u-emil", start: -30, days: 21, status: "IN_PROGRESS", progress: 70, hours: 40, priority: "HIGH", milestone: "m-mu-content", after: ["t-mu-2"] },
            { id: "t-mu-6", group: "Udvikling", title: "Touch-installation og NFC-figurer", assignee: "u-ahmad", start: -35, days: 28, status: "IN_PROGRESS", progress: 65, hours: 70, priority: "CRITICAL", description: "Arduino-baserede NFC-læsere i bordet; figurerne starter fortællinger på skærmen.", checklist: [["NFC-læsere loddet og testet", true], ["3D-printede figurer", true], ["Firmware til Arduino", true], ["Kalibrering i bordpladen", false], ["Stresstest med 30 elever", false]] },
            { id: "t-mu-7", group: "Udvikling", title: "Multiplayer-tilstand for skoleklasser", assignee: "u-jonas", start: -10, days: 16, status: "IN_PROGRESS", progress: 30, hours: 50, after: ["t-mu-3"] },
            { id: "t-mu-8", group: "Installation", title: "Installation og kalibrering på museet", assignee: "u-mette", start: 6, days: 5, status: "TODO", hours: 20, priority: "HIGH", milestone: "m-mu-opening", after: ["t-mu-6", "t-mu-7"] },
            { id: "t-mu-9", group: "Installation", title: "Åbningsevent og overdragelse", assignee: "u-mette", start: 12, days: 0, status: "TODO", hours: 6, milestone: "m-mu-opening", after: ["t-mu-8"] },
        ],
    },
    {
        id: "p-architecture",
        name: "3D-arkitekturvisualisering: Havnefronten",
        description: "Realtime-visualisering af et nyt boligområde ved havnefronten, så bygherre og borgere kan gå rundt i projektet direkte i browseren.",
        client: "Nordlys Arkitekter",
        image: "/images/project_esbjerg_havn.jpg",
        manager: "u-mikkel",
        status: "PLANNED",
        start: 10,
        end: 75,
        members: ["u-mikkel", "u-sofie", "u-laura"],
        milestones: [
            { id: "m-arch-renders", title: "Første renderinger", due: 46, description: "Stillbilleder og en kort gennemflyvning til bygherre." },
            { id: "m-arch-final", title: "Endelig præsentation", due: 75, description: "Præsentation for bygherre og borgermøde." },
        ],
        tasks: [
            { id: "t-ar2-1", group: "Forberedelse", title: "Kick-off og modtagelse af BIM-data", assignee: "u-mikkel", start: 10, days: 3, status: "TODO", hours: 10 },
            { id: "t-ar2-2", group: "Produktion", title: "Konvertering af BIM til realtime-modeller", assignee: "u-sofie", start: 13, days: 15, status: "TODO", hours: 60, after: ["t-ar2-1"] },
            { id: "t-ar2-3", group: "Produktion", title: "Lyssætning, materialer og beplantning", assignee: "u-sofie", start: 28, days: 18, status: "TODO", hours: 70, milestone: "m-arch-renders", after: ["t-ar2-2"] },
            { id: "t-ar2-4", group: "Udvikling", title: "Interaktiv walkthrough i WebGL", assignee: "u-mikkel", start: 36, days: 28, status: "TODO", hours: 80, milestone: "m-arch-final", after: ["t-ar2-2"] },
            { id: "t-ar2-5", group: "Udvikling", title: "UI til valg af lejligheder og dagslys", assignee: "u-laura", start: 44, days: 18, status: "TODO", hours: 40, milestone: "m-arch-final" },
            { id: "t-ar2-6", group: "Præsentation", title: "Præsentation for bygherre", assignee: "u-mikkel", start: 72, days: 3, status: "TODO", hours: 12, milestone: "m-arch-final", after: ["t-ar2-4", "t-ar2-5"] },
        ],
    },
    {
        id: "p-webxr-fair",
        name: "WebXR-messestand",
        description: "Browserbaseret 3D-messestand med produktdemoer, som besøgende kunne åbne via QR-kode på standen.",
        client: "Dansk Industri Expo",
        image: "/images/innovationcamp-expo.png",
        manager: "u-mikkel",
        status: "COMPLETED",
        previousStatus: "ACTIVE",
        start: -150,
        end: -60,
        members: ["u-mikkel", "u-jonas", "u-sofie"],
        milestones: [
            { id: "m-fair-open", title: "Messeåbning", due: -62, description: "Standen er live på messen." },
        ],
        tasks: [
            { id: "t-fa-1", group: "Design", title: "Standdesign og 3D-assets", assignee: "u-sofie", start: -150, days: 30, status: "DONE", hours: 70 },
            { id: "t-fa-2", group: "Udvikling", title: "Three.js-scene og produktdemoer", assignee: "u-jonas", start: -125, days: 40, status: "DONE", hours: 110, after: ["t-fa-1"] },
            { id: "t-fa-3", group: "Udvikling", title: "QR-onboarding og analytics", assignee: "u-mikkel", start: -95, days: 20, status: "DONE", hours: 30 },
            { id: "t-fa-4", group: "Levering", title: "Performancetest på mobil", assignee: "u-jonas", start: -75, days: 10, status: "DONE", hours: 20, milestone: "m-fair-open", after: ["t-fa-2"] },
        ],
    },
    {
        id: "p-showroom",
        name: "Virtuelt showroom til erhvervsnetværk",
        description: "Fælles virtuelt showroom hvor netværkets medlemsvirksomheder kan præsentere produkter i VR. Sat på pause, mens kunden afklarer finansiering.",
        client: "Fynsk Erhvervsnetværk",
        image: "/images/stock_vr_service.png",
        manager: "u-ahmad",
        status: "ON_HOLD",
        previousStatus: "ACTIVE",
        start: -40,
        end: 60,
        members: ["u-ahmad", "u-laura"],
        milestones: [
            { id: "m-sr-concept", title: "Konceptpræsentation", due: -20, description: "Koncept præsenteret for netværkets bestyrelse.", manualDone: true },
        ],
        tasks: [
            { id: "t-sr-1", group: "Koncept", title: "Konceptudvikling og moodboards", assignee: "u-laura", start: -40, days: 18, status: "DONE", hours: 30 },
            { id: "t-sr-2", group: "Udvikling", title: "Teknisk proof of concept i SynergyXR", assignee: "u-ahmad", start: -22, days: 30, status: "IN_PROGRESS", progress: 40 },
            { id: "t-sr-3", group: "Udvikling", title: "Onboarding-flow for medlemsvirksomheder", assignee: "u-laura", start: 10, days: 20, status: "TODO" },
        ],
    },
];

export function createSeedData(today = todayISO()): WorkspaceData {
    const now = new Date().toISOString();
    const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
    const day = (offset: number) => addDays(today, offset);

    const data: WorkspaceData = {
        users: users.map((u) => ({ ...u, createdAt: hoursAgo(24 * 400) })),
        projects: [],
        members: [],
        tasks: [],
        dependencies: [],
        milestones: [],
        statusHistory: [],
        activity: [],
    };

    for (const spec of projects) {
        const project: Project = {
            id: spec.id,
            name: spec.name,
            description: spec.description,
            client: spec.client,
            managerId: spec.manager,
            status: spec.status,
            startDate: day(spec.start),
            endDate: day(spec.end),
            imageUrl: spec.image,
            archived: false,
            createdAt: hoursAgo(24 * Math.max(1, -spec.start + 14)),
            updatedAt: now,
        };
        data.projects.push(project);

        data.members.push(...spec.members.map<ProjectMember>((userId) => ({ projectId: spec.id, userId, addedAt: project.createdAt })));

        data.statusHistory.push({
            id: `h-${spec.id}-0`,
            projectId: spec.id,
            from: null,
            to: spec.previousStatus ?? (spec.status === "ACTIVE" ? "PLANNED" : spec.status),
            changedBy: spec.manager,
            changedAt: project.createdAt,
        } satisfies ProjectStatusHistory);
        if (spec.previousStatus || spec.status === "ACTIVE") {
            data.statusHistory.push({
                id: `h-${spec.id}-1`,
                projectId: spec.id,
                from: spec.previousStatus ?? "PLANNED",
                to: spec.status,
                changedBy: spec.manager,
                changedAt: spec.status === "ACTIVE" ? hoursAgo(24 * -spec.start) : hoursAgo(24 * 5),
            });
        }

        for (const m of spec.milestones) {
            data.milestones.push({
                id: m.id,
                projectId: spec.id,
                title: m.title,
                description: m.description,
                dueDate: day(m.due),
                completedManually: m.manualDone ?? false,
                completedAt: m.manualDone ? hoursAgo(24 * -m.due) : null,
                createdAt: project.createdAt,
            } satisfies Milestone);
        }

        for (const t of spec.tasks) {
            data.tasks.push({
                id: t.id,
                projectId: spec.id,
                title: t.title,
                description: t.description ?? "",
                status: t.status,
                priority: t.priority ?? "MEDIUM",
                assigneeId: t.assignee,
                group: t.group,
                startDate: day(t.start),
                dueDate: day(t.start + t.days),
                progress: t.status === "DONE" ? 100 : t.progress ?? 0,
                estimateHours: t.hours ?? null,
                milestoneId: t.milestone ?? null,
                checklist: (t.checklist ?? []).map(([text, done], i) => ({ id: `${t.id}-c${i}`, text, done })),
                createdAt: project.createdAt,
                updatedAt: now,
            } satisfies Task);
            for (const predecessorId of t.after ?? []) {
                data.dependencies.push({ id: `d-${predecessorId}-${t.id}`, predecessorId, successorId: t.id } satisfies TaskDependency);
            }
        }
    }

    const activity: Omit<ActivityLog, "id">[] = [
        { type: "TASK_STATUS", actorId: "u-sofie", projectId: "p-vr-training", taskId: "t-vr-3", message: "flyttede \"3D-modellering af vindmøllenacelle\" til Til review", createdAt: hoursAgo(2) },
        { type: "TASK_UPDATED", actorId: "u-jonas", projectId: "p-vr-training", taskId: "t-vr-5", message: "opdaterede fremdrift på \"Interaktionssystem: greb og værktøjer\" til 75 %", createdAt: hoursAgo(5) },
        { type: "TASK_UPDATED", actorId: "u-ahmad", projectId: "p-museum", taskId: "t-mu-6", message: "opdaterede fremdrift på \"Touch-installation og NFC-figurer\" til 65 %", createdAt: hoursAgo(20) },
        { type: "TASK_STATUS", actorId: "u-sofie", projectId: "p-museum", taskId: "t-mu-4", message: "flyttede \"Miljø: vikingelandsby i Unity\" til Til review", createdAt: hoursAgo(28) },
        { type: "TASK_CREATED", actorId: "u-ahmad", projectId: "p-ar-furniture", taskId: "t-ar-8", message: "oprettede opgaven \"Integration med webshop-API\"", createdAt: hoursAgo(50) },
        { type: "PROJECT_STATUS", actorId: "u-ahmad", projectId: "p-showroom", taskId: null, message: "ændrede status på \"Virtuelt showroom til erhvervsnetværk\" til På pause", createdAt: hoursAgo(24 * 5) },
        { type: "PROJECT_CREATED", actorId: "u-mikkel", projectId: "p-architecture", taskId: null, message: "oprettede projektet \"3D-arkitekturvisualisering: Havnefronten\"", createdAt: hoursAgo(24 * 6) },
    ];
    data.activity = activity.map((a, i) => ({ ...a, id: `a-seed-${i}` }));

    return data;
}
