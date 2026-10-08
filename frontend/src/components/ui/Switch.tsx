interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;               // accessible name; visible text usually sits next to the switch
    disabled?: boolean;
    describedBy?: string;
}

function Switch({ checked, onChange, label, disabled = false, describedBy }: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            className="switch"
            aria-checked={checked}
            aria-label={label}
            aria-describedby={describedBy}
            disabled={disabled}
            onClick={() => onChange(!checked)}
        />
    );
}

export default Switch;
