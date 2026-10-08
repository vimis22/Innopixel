import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "./config/routes";
import Layout from "./components/layout/Layout";
import MainPage from "./pages/MainPage";
import Services from "./pages/Services";
import Projects from "./pages/Projects";
import History from "./pages/History";
import Contact from "./pages/Contact";
import LoadingState from "./components/ui/LoadingState";

// The internal platform is loaded on demand, so visitors of the public site don't download it
const LoginPage = lazy(() => import("./features/auth/LoginPage"));
const AppRoutes = lazy(() => import("./features/app/AppRoutes"));

function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={<LoadingState fullscreen />}>
                <Routes>
                    {/* Every public page is rendered inside Layout's <Outlet /> */}
                    <Route element={<Layout />}>
                        <Route index element={<MainPage />} />
                        <Route path={ROUTES.services} element={<Services />} />
                        <Route path={ROUTES.projects} element={<Projects />} />
                        <Route path={ROUTES.story} element={<History />} />
                        <Route path={ROUTES.contact} element={<Contact />} />
                        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
                    </Route>

                    {/* Internal platform: own layout, no public header or footer */}
                    <Route path={ROUTES.login} element={<LoginPage />} />
                    <Route path="/app/*" element={<AppRoutes />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;
