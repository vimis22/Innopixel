import { useCallback, useId, useRef, useState, type ComponentType, type KeyboardEvent } from "react";
import type { IconProps } from "../icons/Icons";
import { MoreIcon } from "../icons/AppIcons";
import { useDismiss } from "../../hooks/useDismiss";

export interface MenuAction {
    label: string;
    Icon?: ComponentType<IconProps>;
    onSelect: () => void;
    danger?: boolean;
}

interface ActionMenuProps {
    label: string;               // accessible name of the trigger, e.g. "Handlinger for XR Showroom"
    actions: MenuAction[];       // pass only the actions the user may perform
}

// The "⋮" menu on rows and cards. Renders nothing when there are no permitted actions.
function ActionMenu({ label, actions }: ActionMenuProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const menuId = useId();
    const close = useCallback(() => setOpen(false), []);
    useDismiss(open, ref, close);

    if (actions.length === 0) return null;

    // Arrow keys move between items (WAI-ARIA menu pattern)
    function onMenuKey(event: KeyboardEvent<HTMLDivElement>) {
        const items = [...(ref.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? [])];
        const index = items.indexOf(document.activeElement as HTMLButtonElement);
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const next = event.key === "ArrowDown" ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
            items[next]?.focus();
        }
        if (event.key === "Tab") setOpen(false);
    }

    return (
        <div className="menu-wrap" ref={ref} onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                className="icon-btn icon-btn--sm"
                aria-label={label}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open ? menuId : undefined}
                onClick={() => setOpen((o) => !o)}
            >
                <MoreIcon />
            </button>
            {open && (
                <div className="menu" role="menu" id={menuId} onKeyDown={onMenuKey}>
                    {actions.map(({ label: itemLabel, Icon, onSelect, danger }, i) => (
                        <button
                            key={itemLabel}
                            type="button"
                            role="menuitem"
                            className={`menu-item ${danger ? "menu-item--danger" : ""}`}
                            autoFocus={i === 0}
                            onClick={() => {
                                setOpen(false);
                                onSelect();
                            }}
                        >
                            {Icon && <Icon aria-hidden="true" />}
                            {itemLabel}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ActionMenu;
