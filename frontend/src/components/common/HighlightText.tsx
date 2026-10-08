import { Fragment } from "react";

// Matches the gradient markup used in translations.json and captures the word inside it
const HIGHLIGHT = /<span class="gradient-text">(.*?)<\/span>/;

interface HighlightTextProps {
    text: string;
}

// Renders "Vores <span class="gradient-text">Ydelser</span>" as real React elements,
// so translated titles never need dangerouslySetInnerHTML.
function HighlightText({ text }: HighlightTextProps) {
    // split() with a capture group keeps the captured words at the odd indexes
    const parts = text.split(HIGHLIGHT);

    return (
        <>
            {parts.map((part, index) => (
                <Fragment key={index}>
                    {index % 2 === 1 ? <span className="gradient-text">{part}</span> : part}
                </Fragment>
            ))}
        </>
    );
}

export default HighlightText;
