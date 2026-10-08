import type { ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon, SortIcon } from "../icons/AppIcons";
import { nextSort, type SortState } from "./sorting";

export type { SortState } from "./sorting";

interface SortHeaderProps<K extends string> {
    sortKey: K;
    sort: SortState<K>;
    onSort: (sort: SortState<K>) => void;
    children: ReactNode;
    className?: string;
}

export function SortHeader<K extends string>({ sortKey, sort, onSort, children, className }: SortHeaderProps<K>) {
    const active = sort.key === sortKey;
    return (
        <th scope="col" className={className} aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}>
            <button type="button" className={`th-sort ${active ? "is-active" : ""}`} onClick={() => onSort(nextSort(sort, sortKey))}>
                {children}
                <SortIcon aria-hidden="true" />
            </button>
        </th>
    );
}

interface PagerProps {
    page: number;
    pageCount: number;
    onChange: (page: number) => void;
    labels: { previous: string; next: string; page: (n: number) => string };
}

export function Pager({ page, pageCount, onChange, labels }: PagerProps) {
    if (pageCount <= 1) return null;
    return (
        <nav className="pager" aria-label="Sider">
            <button type="button" className="icon-btn icon-btn--sm icon-btn--bordered" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label={labels.previous}>
                <ChevronLeftIcon />
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button
                    key={n}
                    type="button"
                    className={`icon-btn icon-btn--sm icon-btn--bordered ${n === page ? "is-current" : ""}`}
                    aria-current={n === page ? "page" : undefined}
                    aria-label={labels.page(n)}
                    onClick={() => onChange(n)}
                >
                    {n}
                </button>
            ))}
            <button type="button" className="icon-btn icon-btn--sm icon-btn--bordered" disabled={page === pageCount} onClick={() => onChange(page + 1)} aria-label={labels.next}>
                <ChevronRightIcon />
            </button>
        </nav>
    );
}
