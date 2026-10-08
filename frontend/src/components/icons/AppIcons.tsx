import { OutlineIcon, type IconProps } from "./Icons";

// Icons used by the internal platform (24×24 outline, current text color)

export function DashboardIcon(props: IconProps) {
    return <OutlineIcon {...props}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></OutlineIcon>;
}

export function FolderIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></OutlineIcon>;
}

export function CheckSquareIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M9 11l3 3 8-8" /><path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9" /></OutlineIcon>;
}

export function GanttIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M4 5h9M8 10h10M6 15h7M11 20h9" /></OutlineIcon>;
}

export function KanbanIcon(props: IconProps) {
    return <OutlineIcon {...props}><rect x="3" y="4" width="5" height="16" rx="1.5" /><rect x="10" y="4" width="5" height="10" rx="1.5" /><rect x="17" y="4" width="4" height="13" rx="1.5" /></OutlineIcon>;
}

export function FlagIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M5 21V4m0 0h11l-2 4 2 4H5" /></OutlineIcon>;
}

export function UsersIcon(props: IconProps) {
    return <OutlineIcon {...props}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M18 14a6 6 0 013.5 6" /></OutlineIcon>;
}

export function SettingsIcon(props: IconProps) {
    return <OutlineIcon {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></OutlineIcon>;
}

export function SearchIcon(props: IconProps) {
    return <OutlineIcon {...props}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></OutlineIcon>;
}

export function LogoutIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l5-5-5-5M15 12H3" /></OutlineIcon>;
}

export function ChevronDownIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M6 9l6 6 6-6" /></OutlineIcon>;
}

export function ChevronRightIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M9 6l6 6-6 6" /></OutlineIcon>;
}

export function ChevronLeftIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M15 6l-6 6 6 6" /></OutlineIcon>;
}

export function PlusIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M12 5v14M5 12h14" /></OutlineIcon>;
}

export function EditIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16v4z" /></OutlineIcon>;
}

export function TrashIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4h6v3" /></OutlineIcon>;
}

export function ArchiveIcon(props: IconProps) {
    return <OutlineIcon {...props}><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8M10 12h4" /></OutlineIcon>;
}

export function EyeIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></OutlineIcon>;
}

export function EyeOffIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M10.6 5.1A10 10 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3 3.9M6.6 6.6A17 17 0 002 12s3.5 7 10 7a9.6 9.6 0 005.4-1.6M9.9 9.9a3 3 0 004.2 4.2M3 3l18 18" /></OutlineIcon>;
}

export function CalendarIcon(props: IconProps) {
    return <OutlineIcon {...props}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></OutlineIcon>;
}

export function AlertIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></OutlineIcon>;
}

export function ClockIcon(props: IconProps) {
    return <OutlineIcon {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></OutlineIcon>;
}

export function CheckIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M5 12l5 5L20 7" /></OutlineIcon>;
}

export function PauseIcon(props: IconProps) {
    return <OutlineIcon {...props}><circle cx="12" cy="12" r="9" /><path d="M10 9v6M14 9v6" /></OutlineIcon>;
}

export function BanIcon(props: IconProps) {
    return <OutlineIcon {...props}><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></OutlineIcon>;
}

export function MenuIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M4 6h16M4 12h16M4 18h16" /></OutlineIcon>;
}

export function GridIcon(props: IconProps) {
    return <OutlineIcon {...props}><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></OutlineIcon>;
}

export function ListIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></OutlineIcon>;
}

export function ArrowLeftIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M19 12H5M11 18l-6-6 6-6" /></OutlineIcon>;
}

export function ActivityIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M3 12h4l3-8 4 16 3-8h4" /></OutlineIcon>;
}

export function TrendIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M3 17l6-6 4 4 8-8M15 7h6v6" /></OutlineIcon>;
}

export function DiamondIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M12 3l9 9-9 9-9-9 9-9z" /></OutlineIcon>;
}

export function LockIcon(props: IconProps) {
    return <OutlineIcon {...props}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></OutlineIcon>;
}

export function GlobeIcon(props: IconProps) {
    return <OutlineIcon {...props}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></OutlineIcon>;
}

export function RefreshIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M20 11a8 8 0 00-14.9-3M4 5v3h3M4 13a8 8 0 0014.9 3M20 19v-3h-3" /></OutlineIcon>;
}

export function UserIcon(props: IconProps) {
    return <OutlineIcon {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></OutlineIcon>;
}

export function ArrowRightIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M5 12h14M13 6l6 6-6 6" /></OutlineIcon>;
}

export function MoreIcon(props: IconProps) {
    return <OutlineIcon {...props}><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></OutlineIcon>;
}

export function FilterIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M4 5h16l-6 7.5V19l-4-2v-4.5L4 5z" /></OutlineIcon>;
}

export function SortIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M8 4v16M4 8l4-4 4 4M16 20V4M12 16l4 4 4-4" /></OutlineIcon>;
}

export function PlayIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M7 4.5v15l12-7.5-12-7.5z" /></OutlineIcon>;
}

export function BellIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 003.4 0" /></OutlineIcon>;
}

export function MonitorIcon(props: IconProps) {
    return <OutlineIcon {...props}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></OutlineIcon>;
}

export function ShieldIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /></OutlineIcon>;
}

export function PhoneIcon(props: IconProps) {
    return <OutlineIcon {...props}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2" /></OutlineIcon>;
}

export function BriefcaseIcon(props: IconProps) {
    return <OutlineIcon {...props}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18" /></OutlineIcon>;
}

export function InfoIcon(props: IconProps) {
    return <OutlineIcon {...props}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></OutlineIcon>;
}

export function CircleIcon(props: IconProps) {
    return <OutlineIcon {...props}><circle cx="12" cy="12" r="8" /></OutlineIcon>;
}

export function CheckCircleFilledIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 24 24" {...props}>
            <circle cx="12" cy="12" r="9" fill="currentColor" />
            <path d="M8 12.5l2.5 2.5L16 9.5" fill="none" stroke="var(--surface-2, #141418)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
