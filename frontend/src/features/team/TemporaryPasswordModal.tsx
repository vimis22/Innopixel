import { useState } from "react";
import { useAppText } from "../../i18n/app/useAppText";
import Modal from "../../components/ui/Modal";

// Shows a new account's (or a reset) temporary password once, so the administrator can pass it on
function TemporaryPasswordModal({ name, password, onClose }: { name: string; password: string; onClose: () => void }) {
    const text = useAppText();
    const t = text.team;
    const [copied, setCopied] = useState(false);

    async function copy() {
        try {
            await navigator.clipboard.writeText(password);
            setCopied(true);
        } catch {
            // Clipboard not available (e.g. insecure context): the password is still visible and selectable
        }
    }

    return (
        <Modal
            open
            size="sm"
            title={t.temporaryPasswordTitle}
            onClose={onClose}
            footer={<button type="button" className="app-btn app-btn--primary" onClick={onClose}>{t.temporaryPasswordDone}</button>}
        >
            <p>{t.temporaryPasswordText(name)}</p>
            <div className="temporary-password">
                <code aria-label={t.temporaryPasswordTitle}>{password}</code>
                <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={() => void copy()}>
                    {copied ? t.temporaryPasswordCopied : t.temporaryPasswordCopy}
                </button>
            </div>
        </Modal>
    );
}

export default TemporaryPasswordModal;
