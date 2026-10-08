import { useCallback, useState } from "react";
import { projects } from "../../data/projects";
import type { Project } from "../../types/project";
import ProjectCard from "./ProjectCard";
import ProjectDrawer from "./ProjectDrawer";

function ProjectsSection() {
    // The section owns which project is open, and shares it with the cards and the drawer
    const [selected, setSelected] = useState<Project | null>(null);
    const closeDrawer = useCallback(() => setSelected(null), []);

    return (
        <>
            <section className="projects-section section-flush">
                <div className="container">
                    <div className="projects-grid">
                        {projects.map((project) => (
                            <ProjectCard key={project.id} project={project} onOpen={setSelected} />
                        ))}
                    </div>
                </div>
            </section>

            <ProjectDrawer project={selected} onClose={closeDrawer} />
        </>
    );
}

export default ProjectsSection;
