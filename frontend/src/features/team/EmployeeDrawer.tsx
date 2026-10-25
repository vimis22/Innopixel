import { useCallback, useState } from "react";
import type { CreatedUser, User } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import Drawer from "../../components/ui/Drawer";
import Tabs, { TabPanel } from "../../components/ui/Tabs";
import { useFeedback } from "../../components/ui/Feedback";
import EmployeeAccessTab from "./EmployeeAccessTab";
import EmployeeGeneralTab from "./EmployeeGeneralTab";
import EmployeeProjectsTab from "./EmployeeProjectsTab";
import EmployeeTimeTab from "./EmployeeTimeTab";

export type EmployeeTab = "general" | "access" | "projects" | "time";

interface EmployeeDrawerProps {
    user?: User;                 // undefined: create a new employee
    admin: boolean;
    initialTab?: EmployeeTab;
    onClose: () => void;
    onCreated: (created: CreatedUser) => void;
}

/*
 * Everything about one employee in four tabs. Tabs stay mounted while hidden, so switching tab keeps
 * unsaved edits; closing with unsaved edits asks first. Each tab saves on its own.
 */
function EmployeeDrawer({ user, admin, initialTab = "general", onClose, onCreated }: EmployeeDrawerProps) {
    const text = useAppText();
    const t = text.team;
    const { confirm } = useFeedback();
    const [tab, setTab] = useState<EmployeeTab>(user ? initialTab : "general");
    const [dirtyTabs, setDirtyTabs] = useState<Set<EmployeeTab>>(new Set());
    // The time tab loads data from the server, so it mounts on first visit (and then stays mounted)
    const [timeVisited, setTimeVisited] = useState(tab === "time");

    function selectTab(next: EmployeeTab) {
        setTab(next);
        if (next === "time") setTimeVisited(true);
    }

    const markDirty = useCallback((key: EmployeeTab, dirty: boolean) => {
        setDirtyTabs((current) => {
            if (current.has(key) === dirty) return current;
            const next = new Set(current);
            if (dirty) next.add(key);
            else next.delete(key);
            return next;
        });
    }, []);
    const generalDirty = useCallback((dirty: boolean) => markDirty("general", dirty), [markDirty]);
    const projectsDirty = useCallback((dirty: boolean) => markDirty("projects", dirty), [markDirty]);
    const timeDirty = useCallback((dirty: boolean) => markDirty("time", dirty), [markDirty]);

    async function requestClose() {
        if (dirtyTabs.size > 0) {
            const yes = await confirm({ title: t.unsavedTitle, message: t.unsavedMessage, confirmLabel: t.discard, danger: true });
            if (!yes) return;
        }
        onClose();
    }

    const tabs: { value: EmployeeTab; label: string }[] = !user
        ? []
        : admin
            ? [
                { value: "general", label: t.tabGeneral },
                { value: "access", label: t.tabAccess },
                { value: "projects", label: t.tabProjects },
                { value: "time", label: t.tabTime },
            ]
            : [
                { value: "general", label: t.tabGeneral },
                { value: "projects", label: t.tabProjects },
            ];
    const options = tabs.map((option) => ({ ...option, label: dirtyTabs.has(option.value) ? `${option.label} •` : option.label }));

    return (
        <Drawer
            open
            size="lg"
            title={user ? (admin ? t.edit : user.name) : t.create}
            subtitle={user && admin ? user.name : undefined}
            onClose={() => void requestClose()}
            closeLabel={text.common.close}
            header={tabs.length > 0 && <Tabs id="employee" label={t.edit} options={options} value={tab} onChange={selectTab} />}
        >
            <TabPanel id="employee" value="general" hidden={tab !== "general"}>
                <EmployeeGeneralTab user={user} readOnly={!admin} onDirtyChange={generalDirty} onCreated={onCreated} />
            </TabPanel>
            {user && admin && (
                <TabPanel id="employee" value="access" hidden={tab !== "access"}>
                    <EmployeeAccessTab user={user} />
                </TabPanel>
            )}
            {user && (
                <TabPanel id="employee" value="projects" hidden={tab !== "projects"}>
                    <EmployeeProjectsTab user={user} editable={admin} onDirtyChange={projectsDirty} />
                </TabPanel>
            )}
            {user && admin && timeVisited && (
                <TabPanel id="employee" value="time" hidden={tab !== "time"}>
                    <EmployeeTimeTab user={user} onDirtyChange={timeDirty} />
                </TabPanel>
            )}
        </Drawer>
    );
}

export default EmployeeDrawer;
