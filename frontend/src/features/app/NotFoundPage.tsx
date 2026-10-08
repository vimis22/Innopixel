import { Link } from "react-router-dom";
import { APP_ROUTES } from "../../config/routes";
import { useAppText } from "../../i18n/app/useAppText";
import { EmptyState } from "../../components/ui/States";
import { AlertIcon } from "../../components/icons/AppIcons";

function NotFoundPage() {
    const text = useAppText();
    return (
        <EmptyState
            Icon={AlertIcon}
            title={text.errors.notFoundTitle}
            action={<Link to={APP_ROUTES.dashboard} className="app-btn app-btn--primary">{text.errors.backToDashboard}</Link>}
        >
            {text.errors.notFoundText}
        </EmptyState>
    );
}

export default NotFoundPage;
