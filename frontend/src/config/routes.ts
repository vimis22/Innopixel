// All URLs of the site. Change a path here and every link follows.
export const ROUTES = {
    home: "/",
    services: "/ydelser",
    projects: "/projekter",
    story: "/historie",
    contact: "/kontakt",
    login: "/login",
} as const;

// Links shown in both the header and the footer (the header adds Contact as a separate button)
export const NAV_ITEMS = [
    { to: ROUTES.home, key: "nav.home" },
    { to: ROUTES.services, key: "nav.services" },
    { to: ROUTES.projects, key: "nav.projects" },
    { to: ROUTES.story, key: "nav.story" },
];

// Internal platform (requires login)
export const APP_ROUTES = {
    dashboard: "/app",
    projects: "/app/projects",
    project: (projectId: string) => `/app/projects/${projectId}`,
    tasks: "/app/tasks",
    gantt: "/app/gantt",
    board: "/app/board",
    milestones: "/app/milestones",
    team: "/app/team",
    settings: "/app/settings",
} as const;
