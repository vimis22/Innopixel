import type { KeyboardEvent, ReactNode } from "react";

export interface TabOption<T extends string> {
    value: T;
    label: string;
    count?: number;
}

interface TabsProps<T extends string> {
    id: string;                  // prefix for tab and panel ids, unique on the page
    label: string;
    options: TabOption<T>[];
    value: T;
    onChange: (value: T) => void;
}

// Switches between panels of one page or drawer (WAI-ARIA tabs pattern: arrow keys, Home and End)
function Tabs<T extends string>({ id, label, options, value, onChange }: TabsProps<T>) {
    function onKey(event: KeyboardEvent<HTMLButtonElement>) {
        const index = options.findIndex((o) => o.value === value);
        const moves: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: options.length - 1 };
        if (!(event.key in moves)) return;
        event.preventDefault();
        const next = options[(moves[event.key] + options.length) % options.length].value;
        onChange(next);
        document.getElementById(`${id}-tab-${next}`)?.focus();
    }

    return (
        <div className="tabs" role="tablist" aria-label={label}>
            {options.map((option) => (
                <button
                    key={option.value}
                    id={`${id}-tab-${option.value}`}
                    type="button"
                    role="tab"
                    aria-selected={value === option.value}
                    aria-controls={`${id}-panel-${option.value}`}
                    tabIndex={value === option.value ? 0 : -1}
                    className={`tab ${value === option.value ? "is-active" : ""}`}
                    onClick={() => onChange(option.value)}
                    onKeyDown={onKey}
                >
                    {option.label}
                    {option.count !== undefined && <span className="tab-count">{option.count}</span>}
                </button>
            ))}
        </div>
    );
}

// The panel belonging to a tab. Pass `hidden` to keep an inactive panel mounted (and its state) while not shown.
export function TabPanel({ id, value, children, className, hidden }: { id: string; value: string; children: ReactNode; className?: string; hidden?: boolean }) {
    return (
        <div id={`${id}-panel-${value}`} role="tabpanel" aria-labelledby={`${id}-tab-${value}`} className={className} hidden={hidden}>
            {children}
        </div>
    );
}

export default Tabs;
