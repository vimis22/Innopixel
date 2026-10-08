import PageBanner from "../components/common/PageBanner";
import ProjectsSection from "../components/projects/ProjectsSection";

function Projects() {
    return (
        <>
            <PageBanner i18nKey="projectsPage" />
            <ProjectsSection />
        </>
    );
}

export default Projects;
