import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import PixelBackground from "../three/PixelBackground";
import ChatbotWidget from "../../features/chatbot/components/ChatbotWidget";

// Shared frame around every page. The current page is rendered in <Outlet />.
function Layout() {
    const { pathname } = useLocation();

    // Start at the top when navigating to another page
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <>
            <PixelBackground />
            <Header />
            <main>
                <Outlet />
            </main>
            <Footer />
            <ChatbotWidget />
        </>
    );
}

export default Layout;
