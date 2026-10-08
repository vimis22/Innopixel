import { useAppText } from "../../i18n/app/useAppText";

function LoadingState({ fullscreen = false, label }: { fullscreen?: boolean; label?: string }) {
    const text = useAppText();
    return (
        <div className={`loading-state ${fullscreen ? "loading-state--fullscreen" : ""}`} role="status">
            <span className="spinner" aria-hidden="true" />
            <span>{label ?? text.common.loading}</span>
        </div>
    );
}

export default LoadingState;
