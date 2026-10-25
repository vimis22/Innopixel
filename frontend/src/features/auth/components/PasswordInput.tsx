import { useState, type InputHTMLAttributes } from "react";
import { useAppText } from "../../../i18n/app/useAppText";
import { EyeIcon, EyeOffIcon } from "../../../components/icons/AppIcons";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "value"> & {
    value: string;
    onChange: (value: string) => void;
    autoComplete: "current-password" | "new-password";
};

// A password field with a show/hide button. Showing it is a choice of the person typing; it starts hidden.
function PasswordInput({ value, onChange, autoComplete, ...rest }: PasswordInputProps) {
    const t = useAppText().login;
    const [visible, setVisible] = useState(false);

    return (
        <div className="input-with-action">
            <input
                {...rest}
                type={visible ? "text" : "password"}
                autoComplete={autoComplete}
                spellCheck={false}
                autoCapitalize="off"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <button
                type="button"
                className="input-action"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? t.hidePassword : t.showPassword}
                aria-pressed={visible}
                disabled={rest.disabled}
            >
                {visible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
        </div>
    );
}

export default PasswordInput;
