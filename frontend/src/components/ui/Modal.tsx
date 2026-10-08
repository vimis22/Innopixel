import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "../icons/Icons";

interface ModalProps {
    open: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
    footer?: ReactNode;
    size?: "sm" | "md" | "lg";
    closeLabel?: string;
}

// Built on <dialog>, which gives focus trapping, Escape to close and a backdrop for free
function Modal({ open, title, onClose, children, footer, size = "md", closeLabel = "Luk" }: ModalProps) {
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
            className={`app-modal app-modal--${size}`}
            aria-labelledby={titleId}
            // Escape fires "cancel"; let the parent decide by routing it through onClose
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            // A click on the backdrop targets the dialog element itself
            onMouseDown={(event) => {
                if (event.target === ref.current) onClose();
            }}
        >
            {open && (
                <div className="app-modal-inner">
                    <header className="app-modal-header">
                        <h2 id={titleId}>{title}</h2>
                        <button type="button" className="icon-btn" onClick={onClose} aria-label={closeLabel}>
                            <CloseIcon />
                        </button>
                    </header>
                    <div className="app-modal-body">{children}</div>
                    {footer && <footer className="app-modal-footer">{footer}</footer>}
                </div>
            )}
        </dialog>
    );
}

export default Modal;
