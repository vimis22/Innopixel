import type { TimeStatus } from "../../types/time";
import { useAppText } from "../../i18n/app/useAppText";
import { Pill, type PillTone } from "../../components/ui/Badges";

const statusTone: Record<TimeStatus, PillTone> = { ACTIVE: "accent", PENDING: "warning", APPROVED: "success", REJECTED: "danger" };

export function TimeStatusPill({ status }: { status: TimeStatus }) {
    const t = useAppText().time;
    return <Pill tone={statusTone[status]}>{t.status[status]}</Pill>;
}
