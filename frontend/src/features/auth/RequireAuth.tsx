import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../config/routes";
import type { Role } from "../../types/domain";
import { useAuth } from "./AuthContext";
import LoadingState from "../../components/ui/LoadingState";
import ForbiddenPage from "../app/ForbiddenPage";

interface RequireAuthProps {
    children: ReactNode;
    roles?: Role[];
}

// Route guard for the internal platform. This only controls navigation in the browser;
// the backend must authorize every request on its own.
function RequireAuth({ children, roles }: RequireAuthProps) {
    const { user, initializing } = useAuth();
    const location = useLocation();

    if (initializing) return <LoadingState fullscreen />;

    if (!user) {
        return <Navigate to={ROUTES.login} replace state={{ from: location.pathname + location.search }} />;
    }

    if (roles && !roles.includes(user.role)) return <ForbiddenPage />;

    return <>{children}</>;
}

export default RequireAuth;
