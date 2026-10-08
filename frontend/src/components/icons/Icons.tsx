import type { ReactNode, SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

// Shared frame for the outline icons (24×24, drawn with the current text color)
export function OutlineIcon({ children, strokeWidth = 2, ...props }: IconProps & { children: ReactNode }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            {children}
        </svg>
    );
}

/* ---------- Outline icons ---------- */

export function CubeIcon(props: IconProps) {
    return (
        <OutlineIcon {...props}>
            <path d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </OutlineIcon>
    );
}

export function MapPinIcon(props: IconProps) {
    return (
        <OutlineIcon {...props}>
            <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </OutlineIcon>
    );
}

export function CodeIcon(props: IconProps) {
    return (
        <OutlineIcon {...props}>
            <path d="M9.53 16.122a3 3 0 00-2.222-1.124H5.25a2.25 2.25 0 00-2.25 2.25v3c0 1.242 1.008 2.25 2.25 2.25h13.5a2.25 2.25 0 002.25-2.25v-3a2.25 2.25 0 00-2.25-2.25h-2.058a3 3 0 00-2.222 1.124l-.872 1.107a3 3 0 01-4.444 0l-.871-1.107z" />
            <path d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
        </OutlineIcon>
    );
}

export function BrowserIcon(props: IconProps) {
    return (
        <OutlineIcon {...props}>
            <path d="M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
            <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25V9m7.5 0H6m9.75 0v3A2.25 2.25 0 0113.5 14.25h-3a2.25 2.25 0 01-2.25-2.25V9" />
        </OutlineIcon>
    );
}

export function MailIcon(props: IconProps) {
    return (
        <OutlineIcon {...props}>
            <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </OutlineIcon>
    );
}

export function DocumentIcon(props: IconProps) {
    return (
        <OutlineIcon {...props}>
            <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </OutlineIcon>
    );
}

export function CheckCircleIcon(props: IconProps) {
    return (
        <OutlineIcon {...props}>
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </OutlineIcon>
    );
}

export function CloseIcon(props: IconProps) {
    return (
        <OutlineIcon {...props}>
            <path d="M6 18L18 6M6 6l12 12" />
        </OutlineIcon>
    );
}

/* ---------- Theme toggle (colored by style.css) ---------- */

export function SunIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 24 24" {...props}>
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
    );
}

export function MoonIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 24 24" {...props}>
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    );
}

/* ---------- Brand & flags ---------- */

export function LinkedInIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" {...props}>
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
    );
}

export function DanishFlagIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 640 480" {...props}>
            <path fill="#c8102e" d="M0 0h640v480H0z" />
            <path fill="#fff" d="M205.7 0h68.6v480h-68.6z" />
            <path fill="#fff" d="M0 205.7h640v68.6H0z" />
        </svg>
    );
}

export function BritishFlagIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 640 480" {...props}>
            <path fill="#012169" d="M0 0h640v480H0z" />
            <path stroke="#fff" strokeWidth="60" d="M0 0l640 480M640 0L0 480" />
            <path stroke="#c8102e" strokeWidth="40" d="M0 0l640 480M640 0L0 480" />
            <path stroke="#fff" strokeWidth="100" d="M320 0v480M0 240h640" />
            <path stroke="#c8102e" strokeWidth="60" d="M320 0v480M0 240h640" />
        </svg>
    );
}
