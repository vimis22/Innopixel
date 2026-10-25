import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "../icons/Icons";

interface DrawerProps {
    open: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
    subtitle?: ReactNode;        // short context under the title, e.g. the project of a task
    header?: ReactNode;          // content between the title and the body, e.g. tabs
    footer?: ReactNode;
    size?: "md" | "lg";
    closeLabel?: string;
}

/*
 * Right-side detail panel used for tasks, projects, milestones, employees and time records.
 * Built on <dialog> like Modal, so focus stays inside, Escape closes it and focus returns to the
 * element that opened it. The parent decides what closing means (e.g. asking about unsaved edits).
 */
function Drawer({ open, title, onClose, children, subtitle, header, footer, size = "md", closeLabel = "Luk" }: DrawerProps) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    return (
        <dialog
            ref={ref}
            className={`app-modal app-drawer app-drawer--${size}`}
            aria-labelledby={titleId}
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            onMouseDown={(event) => {
                if (event.target === ref.current) onClose();
            }}
        >
            {open && (
                <div className="app-drawer-inner">
                    <header className="app-drawer-header">
                        <div className="app-drawer-heading">
                            <h2 id={titleId}>{title}</h2>
                            {subtitle && <div className="app-drawer-subtitle">{subtitle}</div>}
                        </div>
                        <button type="button" className="icon-btn" onClick={onClose} aria-label={closeLabel}>
                            <CloseIcon />
                        </button>
                    </header>
                    {header && <div className="app-drawer-tabs">{header}</div>}
                    <div className="app-drawer-body">{children}</div>
                    {footer && <footer className="app-drawer-footer">{footer}</footer>}
                </div>
            )}
        </dialog>
    );
}

export default Drawer;
