import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import type { Project } from "../../types/project";
import { CloseIcon } from "../icons/Icons";

interface ProjectDrawerProps {
    project: Project | null;  // null = closed
    onClose: () => void;
}

function ProjectDrawer({ project, onClose }: ProjectDrawerProps) {
    const { t } = useLanguage();
    const isOpen = project !== null;

    // Keep showing the last project while the drawer slides out
    const [displayed, setDisplayed] = useState<Project | null>(project);
    if (project && project !== displayed) {
        setDisplayed(project);
    }

    // Close on Escape and lock page scrolling while open
    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") onClose();
        }

        window.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    const title = displayed?.title ?? "";

    return (
        <>
            <div className={`project-drawer ${isOpen ? "open" : ""}`} aria-hidden={!isOpen}>
                <button className="drawer-close" aria-label={t("projectsPage.close")} onClick={onClose}>
                    <CloseIcon />
                </button>

                <div className="drawer-content">
                    {displayed && (
                        <div className="drawer-body">
                            <div className="drawer-tag">{displayed.tags.join(" / ")}</div>
                            <h2 className="drawer-title">{title}</h2>
                            <div className="drawer-hero-img-wrapper glow-effect">
                                {displayed.image && <img src={displayed.image} alt={title} />}
                            </div>
                            <div className="drawer-metadata">
                                <div className="meta-item">
                                    <strong>{t("projectsPage.client")}:</strong>
                                    <span>{displayed.client}</span>
                                </div>
                                <div className="meta-item">
                                    <strong>{t("projectsPage.tech")}:</strong>
                                    <span>{displayed.tech}</span>
                                </div>
                            </div>
                            <div className="drawer-description">
                                <p><strong>{displayed.intro}</strong></p>
                                {/* The body comes from the database as HTML (<h4>, <p>), written by Innopixel's administrators */}
                                <div dangerouslySetInnerHTML={{ __html: displayed.body }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className={`drawer-overlay ${isOpen ? "open" : ""}`} onClick={onClose} />
        </>
    );
}

export default ProjectDrawer;
