import { Link } from "react-router-dom";
import { ROUTES } from "../../config/routes";

interface LogoProps {
    onClick?: () => void;
}

// style.css sets the size and swaps the image in the header based on the theme
function Logo({ onClick }: LogoProps) {
    return (
        <Link to={ROUTES.home} className="logo" onClick={onClick}>
            <img src="/images/logo-innopixel-white-text.svg" alt="innopixel" />
        </Link>
    );
}

export default Logo;
