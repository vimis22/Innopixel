import { useLanguage } from "../../context/LanguageContext";
import { useScrollAnimation } from "../../hooks/useScrollAnimation";
import type { Project } from "../../types/project";

interface ProjectCardProps {
    project: Project;
    onOpen: (project: Project) => void;
}

function ProjectCard({ project, onOpen }: ProjectCardProps) {
    const { t, tList } = useLanguage();
    const { ref, inView } = useScrollAnimation<HTMLDivElement>();
    const title = t(`projects.${project.id}.title`);

    return (
        <div
            ref={ref}
            className={`project-card animate-on-scroll ${inView ? "in-view" : ""}`}
            onClick={() => onOpen(project)}
        >
            <div className="project-img-wrapper">
                <img src={project.image} alt={title} />
            </div>
            <div className="project-info">
                <div className="project-tag">{tList(`projects.${project.id}.tags`).join(" / ")}</div>
                <h3>{title}</h3>
                <p className="project-intro">{t(`projects.${project.id}.intro`)}</p>
                <button type="button" className="btn-link text-btn">{t("projectsPage.readMore")}</button>
            </div>
        </div>
    );
}

export default ProjectCard;
