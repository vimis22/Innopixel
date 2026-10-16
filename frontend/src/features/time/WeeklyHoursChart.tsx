import type { CSSProperties } from "react";
import type { ISODate } from "../../types/domain";
import type { TimeDay } from "../../types/time";
import { useAppText } from "../../i18n/app/useAppText";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from "../../components/icons/AppIcons";
import { addDays, formatDate, isoWeek } from "../../utils/date";
import { formatHours, weekdayIndex } from "./timeFormat";
import { timeApi } from "./timeApi";
import { useTimeQuery } from "./useTimeQuery";

interface WeeklyHoursChartProps {
    weekStart: ISODate;
    currentWeekStart: ISODate;
    refresh: number;
    liveMinutes: { date: ISODate; minutes: number } | null;   // running registration, added to its day
    onWeekChange: (weekStart: ISODate) => void;
    onSeeDetails: (weekStart: ISODate) => void;
}

// Registered hours per day as bars, with the planned hours as a dashed target line.
// The same numbers are available as a table for screen readers.
function WeeklyHoursChart({ weekStart, currentWeekStart, refresh, liveMinutes, onWeekChange, onSeeDetails }: WeeklyHoursChartProps) {
    const text = useAppText();
    const t = text.time;
    const { data, failed, retry } = useTimeQuery(() => timeApi.week(weekStart), [weekStart, refresh]);
    const isCurrent = weekStart === currentWeekStart;
    const weekEnd = addDays(weekStart, 6);

    const days: TimeDay[] = (data?.weekStart === weekStart ? data.days : [])
        .map((d) => (liveMinutes && d.date === liveMinutes.date ? { ...d, workedMinutes: Math.max(d.workedMinutes, liveMinutes.minutes) } : d))
        // Weekdays always; weekend days only when time was registered
        .filter((d) => weekdayIndex(d.date) < 5 || d.workedMinutes > 0);

    const maxHours = Math.max(0, ...days.map((d) => Math.max(d.workedMinutes, d.plannedMinutes) / 60));
    const step = maxHours <= 10 ? 2 : 4;
    const top = Math.max(step * 4, Math.ceil(maxHours / step) * step);
    const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
    const percent = (minutes: number) => `${Math.min(100, (minutes / 60 / top) * 100)}%`;

    return (
        <section className="time-week" aria-labelledby="time-week-title">
            <header className="time-week-header">
                <div>
                    <h3 id="time-week-title" className="time-week-title">{isCurrent ? t.weekTitle : t.weekNumber(isoWeek(weekStart))}</h3>
                    <p className="time-week-range">{t.weekOf(formatDate(weekStart, false), formatDate(weekEnd))}</p>
                </div>
                <div className="time-nav">
                    <button type="button" className="icon-btn icon-btn--sm icon-btn--bordered" aria-label={t.previousWeek} onClick={() => onWeekChange(addDays(weekStart, -7))}>
                        <ChevronLeftIcon />
                    </button>
                    <button type="button" className="icon-btn icon-btn--sm icon-btn--bordered" aria-label={t.nextWeek} disabled={isCurrent} onClick={() => onWeekChange(addDays(weekStart, 7))}>
                        <ChevronRightIcon />
                    </button>
                </div>
            </header>

            {failed ? (
                <p className="time-week-error" role="alert">
                    {t.loadFailed} <button type="button" className="link-arrow" onClick={retry}>{t.retry}</button>
                </p>
            ) : (
                <>
                    <div className="time-chart" aria-hidden="true" style={{ "--chart-columns": Math.max(days.length, 5) } as CSSProperties}>
                        <div className="time-chart-axis">
                            {ticks.map((tick) => <span key={tick} style={{ bottom: `${(tick / top) * 100}%` }}>{tick}</span>)}
                        </div>
                        <div className="time-chart-plot">
                            {ticks.map((tick) => <span key={tick} className="time-chart-grid" style={{ bottom: `${(tick / top) * 100}%` }} />)}
                            {days.map((day) => {
                                const label = text.dates.weekdaysShort[weekdayIndex(day.date)];
                                return (
                                    <div key={day.date} className="time-chart-col">
                                        <div className="time-chart-track">
                                            {day.workedMinutes > 0 && <span className="time-chart-bar" style={{ height: percent(day.workedMinutes) }} />}
                                            {day.plannedMinutes > 0 && <span className="time-chart-target" style={{ bottom: percent(day.plannedMinutes) }} />}
                                            <span className="time-chart-tip">
                                                {t.dayTooltip(`${label} ${formatDate(day.date, false)}`, formatHours(day.workedMinutes), formatHours(day.plannedMinutes))}
                                            </span>
                                        </div>
                                        <span className="time-chart-label">{label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="sr-only">
                    <table>
                        <caption>{t.chartLabel(t.weekOf(formatDate(weekStart, false), formatDate(weekEnd)))}</caption>
                        <thead>
                            <tr><th scope="col">{t.colDay}</th><th scope="col">{t.legendRegistered}</th><th scope="col">{t.legendPlanned}</th></tr>
                        </thead>
                        <tbody>
                            {days.map((day) => (
                                <tr key={day.date}>
                                    <th scope="row">{formatDate(day.date)}</th>
                                    <td>{t.hoursShort(formatHours(day.workedMinutes))}</td>
                                    <td>{t.hoursShort(formatHours(day.plannedMinutes))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </>
            )}

            <footer className="time-week-footer">
                <ul className="time-legend">
                    <li><span className="time-legend-target" aria-hidden="true" />{t.legendPlanned}</li>
                    <li><span className="time-legend-bar" aria-hidden="true" />{t.legendRegistered}</li>
                </ul>
                <button type="button" className="link-arrow" onClick={() => onSeeDetails(weekStart)}>
                    {t.seeDetails} <ArrowRightIcon aria-hidden="true" />
                </button>
            </footer>
        </section>
    );
}

export default WeeklyHoursChart;
