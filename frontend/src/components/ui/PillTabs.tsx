interface PillTabOption<T extends string> {
    value: T;
    label: string;
    count?: number;
}

interface PillTabsProps<T extends string> {
    label: string;
    options: PillTabOption<T>[];
    value: T;
    onChange: (value: T) => void;
}

// Quick, mutually exclusive filter (e.g. task status). A group of toggle buttons, not a tablist,
// because it filters the same content instead of switching panels.
function PillTabs<T extends string>({ label, options, value, onChange }: PillTabsProps<T>) {
    return (
        <div className="pill-tabs" role="group" aria-label={label}>
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    className={`pill-tab ${value === option.value ? "is-active" : ""}`}
                    aria-pressed={value === option.value}
                    onClick={() => onChange(option.value)}
                >
                    {option.label}
                    {option.count !== undefined && <span className="pill-tab-count">{option.count}</span>}
                </button>
            ))}
        </div>
    );
}

export default PillTabs;
