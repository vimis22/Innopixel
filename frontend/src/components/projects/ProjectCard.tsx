import { useLanguage } from "../../context/LanguageContext";
import { useScrollAnimation } from "../../hooks/useScrollAnimation";
import type { Project } from "../../types/project";

interface ProjectCardProps {
    project: Project;
    onOpen: (project: Project) => void;
}

function ProjectCard({ project, onOpen }: ProjectCardProps) {
    const { t } = useLanguage();
    const { ref, inView } = useScrollAnimation<HTMLDivElement>();

    return (
        <div
            ref={ref}
            className={`project-card animate-on-scroll ${inView ? "in-view" : ""}`}
            onClick={() => onOpen(project)}
        >
            <div className="project-img-wrapper">
                {project.image && <img src={project.image} alt={project.title} />}
            </div>
            <div className="project-info">
                <div className="project-tag">{project.tags.join(" / ")}</div>
                <h3>{project.title}</h3>
                <p className="project-intro">{project.intro}</p>
                <button type="button" className="btn-link text-btn">{t("projectsPage.readMore")}</button>
            </div>
        </div>
    );
}

export default ProjectCard;
