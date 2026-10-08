import { Link } from "react-router-dom";
import { APP_ROUTES } from "../../config/routes";
import { useAppText } from "../../i18n/app/useAppText";
import { EmptyState } from "../../components/ui/States";
import { LockIcon } from "../../components/icons/AppIcons";

function ForbiddenPage() {
    const text = useAppText();
    return (
        <EmptyState
            Icon={LockIcon}
            title={text.errors.forbiddenTitle}
            action={<Link to={APP_ROUTES.dashboard} className="app-btn app-btn--primary">{text.errors.backToDashboard}</Link>}
        >
            {text.errors.forbiddenText}
        </EmptyState>
    );
}

export default ForbiddenPage;
