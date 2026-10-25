import { useId, type ReactNode } from "react";
import { useAppText } from "../../../i18n/app/useAppText";
import { CheckIcon } from "../../../components/icons/AppIcons";
import { passwordRules, type NewPasswordError } from "../passwordPolicy";
import PasswordInput from "./PasswordInput";

interface NewPasswordFieldsProps {
    idPrefix: string;
    password: string;
    confirmation: string;
    onPasswordChange: (value: string) => void;
    onConfirmationChange: (value: string) => void;
    error: NewPasswordError | null;      // shown after a submit attempt
    disabled?: boolean;
    labels?: { password?: string; confirmation?: string };
    passwordAction?: ReactNode;          // e.g. "Generér" next to the field
    autoFocus?: boolean;
}

/*
 * "Ny adgangskode" + "Bekræft" with the rules as a live checklist. Every form that sets a password uses this,
 * so the rules and messages are the same everywhere (validation itself: passwordPolicy.ts).
 */
function NewPasswordFields({
    idPrefix, password, confirmation, onPasswordChange, onConfirmationChange, error, disabled, labels, passwordAction, autoFocus,
}: NewPasswordFieldsProps) {
    const text = useAppText();
    const t = text.settings.password;
    const rulesId = useId();
    const errorId = `${idPrefix}-error`;
    const passwordError = error === "required" || error === "weak" || error === "sameAsCurrent";
    const message = error ? t.errors[error] : null;

    return (
        <>
            <div className={`field field--full ${passwordError ? "field--invalid" : ""}`}>
                <label htmlFor={`${idPrefix}-new`}>{labels?.password ?? t.new}</label>
                <div className="password-row">
                    <PasswordInput
                        id={`${idPrefix}-new`}
                        autoComplete="new-password"
                        value={password}
                        onChange={onPasswordChange}
                        disabled={disabled}
                        autoFocus={autoFocus}
                        aria-invalid={passwordError}
                        aria-describedby={`${rulesId}${passwordError ? ` ${errorId}` : ""}`}
                    />
                    {passwordAction}
                </div>
                <ul id={rulesId} className="password-rules" aria-label={t.rulesTitle}>
                    {passwordRules(password).map((rule) => (
                        <li key={rule.key} className={rule.met ? "is-met" : ""}>
                            <span className="password-rule-mark" aria-hidden="true">{rule.met && <CheckIcon />}</span>
                            {t.rules[rule.key]}
                            <span className="sr-only">{rule.met ? ` – ${t.ruleMet}` : ` – ${t.ruleMissing}`}</span>
                        </li>
                    ))}
                </ul>
                {passwordError && <p id={errorId} className="field-error" role="alert">{message}</p>}
            </div>
            <div className={`field field--full ${error === "mismatch" ? "field--invalid" : ""}`}>
                <label htmlFor={`${idPrefix}-confirm`}>{labels?.confirmation ?? t.confirm}</label>
                <PasswordInput
                    id={`${idPrefix}-confirm`}
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={onConfirmationChange}
                    disabled={disabled}
                    aria-invalid={error === "mismatch"}
                    aria-describedby={error === "mismatch" ? `${idPrefix}-confirm-error` : undefined}
                />
                {error === "mismatch" && <p id={`${idPrefix}-confirm-error`} className="field-error" role="alert">{message}</p>}
            </div>
        </>
    );
}

export default NewPasswordFields;
