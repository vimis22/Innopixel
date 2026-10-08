import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import Modal from "./Modal";
import { AlertIcon, CheckIcon } from "../icons/AppIcons";
import { CloseIcon } from "../icons/Icons";
import { RepositoryError } from "../../features/workspace/repository";
import { useAppText } from "../../i18n/app/useAppText";

/* Toasts (results of actions) and confirmation dialogs (destructive actions) */

type ToastKind = "success" | "error";

interface Toast {
    id: number;
    kind: ToastKind;
    message: string;
}

interface ConfirmOptions {
    title: string;
    message: string;
    confirmLabel: string;
    danger?: boolean;
}

interface FeedbackContextValue {
    toast: (kind: ToastKind, message: string) => void;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

export function FeedbackProvider({ children }: { children: ReactNode }) {
    const text = useAppText();
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [pending, setPending] = useState<ConfirmOptions | null>(null);
    const resolver = useRef<((value: boolean) => void) | null>(null);
    const nextId = useRef(1);

    const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

    const toast = useCallback((kind: ToastKind, message: string) => {
        const id = nextId.current++;
        setToasts((list) => [...list.slice(-3), { id, kind, message }]);
        setTimeout(() => dismiss(id), kind === "error" ? 7000 : 4000);
    }, [dismiss]);

    const confirm = useCallback((options: ConfirmOptions) => {
        setPending(options);
        return new Promise<boolean>((resolve) => {
            resolver.current = resolve;
        });
    }, []);

    function settle(value: boolean) {
        resolver.current?.(value);
        resolver.current = null;
        setPending(null);
    }

    const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

    return (
        <FeedbackContext.Provider value={value}>
            {children}

            <Modal
                open={pending !== null}
                title={pending?.title ?? ""}
                onClose={() => settle(false)}
                size="sm"
                footer={
                    <>
                        <button type="button" className="app-btn app-btn--ghost" onClick={() => settle(false)}>
                            {text.common.cancel}
                        </button>
                        <button
                            type="button"
                            className={`app-btn ${pending?.danger ? "app-btn--danger" : "app-btn--primary"}`}
                            onClick={() => settle(true)}
                            autoFocus
                        >
                            {pending?.confirmLabel}
                        </button>
                    </>
                }
            >
                <p className="confirm-message">{pending?.message}</p>
            </Modal>

            <div className="toast-region" role="status" aria-live="polite">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast toast--${t.kind}`}>
                        {t.kind === "success" ? <CheckIcon className="toast-icon" /> : <AlertIcon className="toast-icon" />}
                        <span>{t.message}</span>
                        <button type="button" className="icon-btn icon-btn--sm" onClick={() => dismiss(t.id)} aria-label={text.common.close}>
                            <CloseIcon />
                        </button>
                    </div>
                ))}
            </div>
        </FeedbackContext.Provider>
    );
}

// eslint-disable-next-line react/only-export-components
export function useFeedback() {
    const context = useContext(FeedbackContext);
    if (!context) {
        throw new Error("useFeedback must be used inside <FeedbackProvider>");
    }
    return context;
}

// eslint-disable-next-line react/only-export-components
export function errorMessage(error: unknown, fallback: string): string {
    return error instanceof RepositoryError ? error.message : fallback;
}

/*
 * Runs an action and reports the real outcome: a success toast only after the repository
 * confirmed the change, an error toast with the server message otherwise.
 * Returns true on success.
 */
// eslint-disable-next-line react/only-export-components
export function useRunAction() {
    const { toast } = useFeedback();
    const text = useAppText();

    return useCallback(async (action: () => Promise<unknown>, successMessage?: string): Promise<boolean> => {
        try {
            await action();
            if (successMessage) toast("success", successMessage);
            return true;
        } catch (error) {
            toast("error", errorMessage(error, text.common.genericError));
            return false;
        }
    }, [toast, text]);
}
