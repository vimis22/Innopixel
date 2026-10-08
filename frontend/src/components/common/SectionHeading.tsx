import HighlightText from "./HighlightText";

interface SectionHeadingProps {
    subtitle: string;
    title: string;   // may contain a <span class="gradient-text"> word
}

function SectionHeading({ subtitle, title }: SectionHeadingProps) {
    return (
        <>
            <div className="section-subtitle">{subtitle}</div>
            <h2 className="section-title">
                <HighlightText text={title} />
            </h2>
        </>
    );
}

export default SectionHeading;
