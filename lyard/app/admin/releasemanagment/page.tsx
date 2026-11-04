'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ui, showPlaceholder } from '../adminStyles';

type Release = {
    id: number;
    name: string;
    imageUrl: string;
    badge: string;
    released: boolean;
    date: string; // "YYYY-MM-DD"
    sizes: { size: string; units: number }[];
    note?: string;
    distribution: string[];
    marketing: string[];
};

const DISTRIBUTION_OPTIONS = ["Online Store", "Wholesale", "Store Branch"];
const MARKETING_OPTIONS = ["Newsletter", "Text SMS", "Instagram"];

const initialReleases: Release[] = [
    {
        id: 1,
        name: "Fruit Salad",
        imageUrl: "/images/fruit salad.jpg",
        badge: "RELEASED",
        released: true,
        date: "2026-07-09",
        sizes: [
            { size: "50ml", units: 500 },
            { size: "100ml", units: 500 },
            { size: "150ml", units: 250 },
        ],
        distribution: [],
        marketing: [],
    },
    {
        id: 2,
        name: "Pistachio Tiramisu",
        imageUrl: "/images/pistachio tiramisu.jpg",
        badge: "15 DAYS TO GO",
        released: false,
        date: "2026-08-01",
        sizes: [
            { size: "50ml", units: 500 },
            { size: "100ml", units: 500 },
            { size: "150ml", units: 250 },
        ],
        distribution: ["Online Store", "Wholesale"],
        marketing: ["Newsletter", "Text SMS", "Instagram"],
    },
    {
        id: 3,
        name: "Triple Espresso",
        imageUrl: "/images/triple espresso.jpg",
        badge: "31 DAYS TO GO",
        released: false,
        date: "2026-08-19",
        sizes: [],
        note: "Made on demand, based off customer preference",
        distribution: ["Online Store"],
        marketing: ["Newsletter", "Text SMS", "Instagram"],
    },
    {
        id: 4,
        name: "Ube Coconut",
        imageUrl: "/images/ube coconut.jpg",
        badge: "15 DAYS TO GO",
        released: false,
        date: "2026-09-01",
        sizes: [
            { size: "50ml", units: 500 },
            { size: "100ml", units: 500 },
            { size: "150ml", units: 250 },
        ],
        distribution: ["Online Store", "Wholesale"],
        marketing: ["Newsletter", "Text SMS", "Instagram"],
    },
];

// "2026-07-09" -> a Date. Built from its parts so time zones can't shift the day.
function toDate(iso: string) {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day);
}

// Add the value if it's missing, remove it if it's there
function toggleIn(list: string[], value: string) {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// Which days of a given month have a release on them?
function releaseDaysIn(releases: Release[], year: number, month: number) {
    return releases
        .map((r) => toDate(r.date))
        .filter((d) => d.getFullYear() === year && d.getMonth() === month)
        .map((d) => d.getDate());
}

/* ---------- Reusable month calendar ---------- */

type MonthCalendarProps = {
    year: number;
    month: number; // 0 = January ... 11 = December
    highlightedDays: number[];
};

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function MonthCalendar({ year, month, highlightedDays }: MonthCalendarProps) {
    const title = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = [
        ...Array(firstWeekday).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    return (
        <div className={ui.card}>
            <p className="mb-3 text-sm font-bold">{title}</p>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {WEEKDAYS.map((d) => (
                    <p key={d} className="py-1 font-semibold text-zinc-500">{d}</p>
                ))}
                {cells.map((day, index) => (
                    <p key={index} className="flex h-8 items-center justify-center">
                        {day !== null && highlightedDays.includes(day) ? (
                            <mark className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e0b43a] font-bold text-black">{day}</mark>
                        ) : (
                            <span className="text-zinc-200">{day}</span>
                        )}
                    </p>
                ))}
            </div>
        </div>
    );
}

/* ---------- The page ---------- */

export default function ReleaseManagementPage() {
    const [releases, setReleases] = useState<Release[]>(initialReleases);

    function toggleDistribution(id: number, option: string) {
        setReleases((prev) =>
            prev.map((r) =>
                r.id === id ? { ...r, distribution: toggleIn(r.distribution, option) } : r
            )
        );
    }

    function toggleMarketing(id: number, option: string) {
        setReleases((prev) =>
            prev.map((r) =>
                r.id === id ? { ...r, marketing: toggleIn(r.marketing, option) } : r
            )
        );
    }

    return (
        <div className={ui.page}>
            {/* Header */}
            <div className={ui.pageHeader}>
                <div>
                    <p className={ui.breadcrumb}>
                        <Link href="/admin/productmanagement" className={ui.breadcrumbLink}>Products</Link> &gt; Upcoming Releases
                    </p>
                    <h1 className={ui.h1}>Upcoming Releases</h1>
                </div>
                <button type="button" className={ui.btn}>+ NEW DROP</button>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                {/* Release list */}
                <div className="min-w-0 space-y-4">
                    {releases.map((release) => (
                        <article key={release.id} className={`${ui.card} grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]`}>
                            <div className="relative">
                                <img src={release.imageUrl} alt={release.name} className="aspect-square w-full rounded-lg object-cover" onError={showPlaceholder} />
                                <p className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${release.released ? "bg-emerald-600 text-white" : "bg-[#e0b43a] text-black"}`}>{release.badge}</p>
                            </div>

                            <div className="min-w-0 space-y-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-medium uppercase tracking-[.18em] text-white">{release.name}</h2>
                                {release.sizes.map((s) => (
                                    <p key={s.size} className="text-sm text-zinc-400">
                                        {s.size} - {s.units} units
                                    </p>
                                ))}
                                {release.note && <p className="text-sm italic text-zinc-400">{release.note}</p>}
                            </div>

                            <div className="text-right text-sm uppercase tracking-[.12em]">
                                <p className="text-base font-medium text-white">
                                    {toDate(release.date).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        month: "short",
                                        day: "2-digit",
                                        year: "numeric",
                                    })}
                                </p>
                                <p className="text-base text-white">12:00 AM</p>
                            </div>
                            </div>

                            {!release.released && (
                                <div className="grid gap-3 border-t border-zinc-700 pt-3 sm:grid-cols-2">
                                    <div>
                                        <p className={`${ui.label} mb-1`}>Distribution</p>
                                        {DISTRIBUTION_OPTIONS.map((option) => (
                                            <label key={option} className="flex items-center gap-2 py-0.5 text-sm">
                                                <input
                                                    type="checkbox"
                                                    className={ui.checkbox}
                                                    checked={release.distribution.includes(option)}
                                                    onChange={() => toggleDistribution(release.id, option)}
                                                />
                                                <span>{option}</span>
                                            </label>
                                        ))}
                                    </div>

                                    <div>
                                        <p className={`${ui.label} mb-1`}>Marketing</p>
                                        {MARKETING_OPTIONS.map((option) => (
                                            <label key={option} className="flex items-center gap-2 py-0.5 text-sm">
                                                <input
                                                    type="checkbox"
                                                    className={ui.checkbox}
                                                    checked={release.marketing.includes(option)}
                                                    onChange={() => toggleMarketing(release.id, option)}
                                                />
                                                <span>{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                            </div>
                        </article>
                    ))}
                </div>

                {/* Calendars */}
                <div className="space-y-4 xl:sticky xl:top-5 xl:self-start">
                    <MonthCalendar year={2026} month={6} highlightedDays={releaseDaysIn(releases, 2026, 6)} />
                    <MonthCalendar year={2026} month={7} highlightedDays={releaseDaysIn(releases, 2026, 7)} />
                </div>
            </div>
        </div>
    );
}