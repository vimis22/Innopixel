import { useId, type CSSProperties, type ReactNode } from "react";
import { CheckIcon } from "../icons/AppIcons";

export interface ChoiceOption<T extends string> {
    value: T;
    label: string;
    visual?: ReactNode;          // icon, color swatch or sample text above/beside the label
    description?: string;
    style?: CSSProperties;       // e.g. the swatch color as a custom property
}

interface ChoiceGroupProps<T extends string> {
    label: string;
    options: ChoiceOption<T>[];
    value: T;
    onChange: (value: T) => void;
    variant: "card" | "swatch" | "chip";
    describedBy?: string;
}

/*
 * One choice out of a few, shown as cards (theme), color swatches (accent) or chips (text size).
 * Built on native radio buttons, so arrow keys, Tab and screen readers work as for any radio group.
 */
function ChoiceGroup<T extends string>({ label, options, value, onChange, variant, describedBy }: ChoiceGroupProps<T>) {
    const name = useId();
    return (
        <div className={`choice-group choice-group--${variant}`} role="radiogroup" aria-label={label} aria-describedby={describedBy}>
            {options.map((option) => {
                const checked = option.value === value;
                return (
                    <label key={option.value} className={`choice ${checked ? "is-checked" : ""}`} style={option.style}>
                        <input
                            type="radio"
                            className="choice-input"
                            name={name}
                            value={option.value}
                            checked={checked}
                            onChange={() => onChange(option.value)}
                        />
                        {option.visual && <span className="choice-visual" aria-hidden="true">{option.visual}</span>}
                        <span className="choice-text">
                            <span className="choice-label">{option.label}</span>
                            {option.description && <span className="choice-description">{option.description}</span>}
                        </span>
                        {checked && <CheckIcon className="choice-check" aria-hidden="true" />}
                    </label>
                );
            })}
        </div>
    );
}

export default ChoiceGroup;
