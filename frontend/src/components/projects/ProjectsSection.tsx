import { useCallback, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { fetchProjects, usePublicContent } from "../../services/publicContent";
import type { Project } from "../../types/project";
import ProjectCard from "./ProjectCard";
import ProjectDrawer from "./ProjectDrawer";

function ProjectsSection() {
    const { t, language } = useLanguage();
    const { items: projects, loading, failed } = usePublicContent(fetchProjects, language);

    // The section owns which project is open, and shares it with the cards and the drawer
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const selected = projects.find((p) => p.id === selectedId) ?? null;
    const open = useCallback((project: Project) => setSelectedId(project.id), []);
    const closeDrawer = useCallback(() => setSelectedId(null), []);

    return (
        <>
            <section className="projects-section section-flush">
                <div className="container">
                    {failed && projects.length === 0 ? (
                        <p className="content-status" role="alert">{t("projectsPage.loadError")}</p>
                    ) : loading && projects.length === 0 ? (
                        <p className="content-status" aria-live="polite">{t("projectsPage.loading")}</p>
                    ) : (
                        <div className="projects-grid">
                            {projects.map((project) => (
                                <ProjectCard key={project.id} project={project} onOpen={open} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <ProjectDrawer project={selected} onClose={closeDrawer} />
        </>
    );
}

export default ProjectsSection;
