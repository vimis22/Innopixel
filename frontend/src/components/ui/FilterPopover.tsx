import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import { FilterIcon } from "../icons/AppIcons";
import { useDismiss } from "../../hooks/useDismiss";

interface FilterPopoverProps {
    label: string;
    activeCount: number;         // number of filters in use, shown on the button
    title: string;
    children: ReactNode;
    footer?: ReactNode;
}

// Secondary filters behind a button, so they are available without taking up space (progressive disclosure)
function FilterPopover({ label, activeCount, title, children, footer }: FilterPopoverProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const panelId = useId();
    const close = useCallback(() => setOpen(false), []);
    useDismiss(open, ref, close);

    return (
        <div className="popover-wrap" ref={ref}>
            <button
                type="button"
                className={`app-btn app-btn--ghost ${activeCount > 0 ? "is-filtered" : ""}`}
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                onClick={() => setOpen((o) => !o)}
            >
                <FilterIcon aria-hidden="true" />
                {label}
                {activeCount > 0 && <span className="pill-tab-count">{activeCount}</span>}
            </button>
            {open && (
                <div className="popover" id={panelId} role="dialog" aria-label={title}>
                    <p className="popover-title">{title}</p>
                    {children}
                    {footer && <div className="form-actions">{footer}</div>}
                </div>
            )}
        </div>
    );
}

export default FilterPopover;
