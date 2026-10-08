import { Link } from "react-router-dom";
import SectionHeading from "./SectionHeading";
import AnimateOnScroll from "./AnimateOnScroll";
import WireframeCube from "./WireframeCube";

interface StorySectionProps {
    subtitle: string;
    title: string;
    paragraphs: string[];
    action?: { to: string; label: string };   // optional button under the text
    plain?: boolean;                          // no background band (used under a page banner)
    animateVisual?: boolean;                  // fade the cube in on scroll
}

// Rotating cube on one side, heading and text on the other.
// Used on the front page and on the history page.
function StorySection({ subtitle, title, paragraphs, action, plain = false, animateVisual = false }: StorySectionProps) {
    const cube = animateVisual ? (
        <AnimateOnScroll className="story-visual">
            <WireframeCube />
        </AnimateOnScroll>
    ) : (
        <div className="story-visual">
            <WireframeCube />
        </div>
    );

    return (
        <section className={`story-section ${plain ? "story-section--plain" : ""}`}>
            <div className="container story-container">
                {cube}
                <div className="story-content">
                    <SectionHeading subtitle={subtitle} title={title} />
                    {paragraphs.map((text) => (
                        <p key={text}>{text}</p>
                    ))}
                    {action && (
                        <Link to={action.to} className="btn btn-secondary story-action">
                            {action.label}
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
}

export default StorySection;
