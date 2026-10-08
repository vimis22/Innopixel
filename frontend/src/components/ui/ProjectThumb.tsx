import { useState, type CSSProperties } from "react";
import type { Project } from "../../types/domain";

interface ProjectThumbProps {
    project: Pick<Project, "name" | "imageUrl">;
    size?: "sm" | "md" | "lg" | "xl";
    color?: string;              // used for the generated tile when there is no image
}

// Project image, or a tile with the project's initials when no image exists (or it fails to load)
function ProjectThumb({ project, size = "md", color }: ProjectThumbProps) {
    const [failed, setFailed] = useState(false);

    if (project.imageUrl && !failed) {
        return <img src={project.imageUrl} alt="" className={`thumb thumb--${size}`} loading="lazy" onError={() => setFailed(true)} />;
    }

    const initials = project.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
    return (
        <span
            className={`thumb thumb--${size} thumb--placeholder`}
            style={color ? ({ "--thumb-color": color } as CSSProperties) : undefined}
            aria-hidden="true"
        >
            {initials}
        </span>
    );
}

export default ProjectThumb;
