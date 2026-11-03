'use client';

import { useState } from 'react';
import Link from 'next/link';

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
        <div>
            <p>{title}</p>
            <div>
                {WEEKDAYS.map((d) => (
                    <p key={d}>{d}</p>
                ))}
                {cells.map((day, index) => (
                    <p key={index}>
                        {day !== null && highlightedDays.includes(day) ? <mark>{day}</mark> : day}
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
        <div>
            {/* Header */}
            <div>
                <div>
                    <p>
                        <Link href="/admin/productmanagement">Products</Link> &gt; Upcoming Releases
                    </p>
                    <h1>Upcoming Releases</h1>
                </div>
                <button>+ NEW DROP</button>
            </div>

            <div>
                {/* Release list */}
                <div>
                    {releases.map((release) => (
                        <div key={release.id}>
                            <img src={release.imageUrl} alt={release.name} />
                            <p>{release.badge}</p>

                            <div>
                                <h2>{release.name}</h2>
                                {release.sizes.map((s) => (
                                    <p key={s.size}>
                                        {s.size} - {s.units} units
                                    </p>
                                ))}
                                {release.note && <p>{release.note}</p>}
                            </div>

                            <div>
                                <p>
                                    {toDate(release.date).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        month: "short",
                                        day: "2-digit",
                                        year: "numeric",
                                    })}
                                </p>
                                <p>12:00 AM</p>
                            </div>

                            {!release.released && (
                                <div>
                                    <div>
                                        <p>DISTRIBUTION</p>
                                        {DISTRIBUTION_OPTIONS.map((option) => (
                                            <label key={option}>
                                                <input
                                                    type="checkbox"
                                                    checked={release.distribution.includes(option)}
                                                    onChange={() => toggleDistribution(release.id, option)}
                                                />
                                                <span>{option}</span>
                                            </label>
                                        ))}
                                    </div>

                                    <div>
                                        <p>MARKETING</p>
                                        {MARKETING_OPTIONS.map((option) => (
                                            <label key={option}>
                                                <input
                                                    type="checkbox"
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
                    ))}
                </div>

                {/* Calendars */}
                <div>
                    <MonthCalendar year={2026} month={6} highlightedDays={releaseDaysIn(releases, 2026, 6)} />
                    <MonthCalendar year={2026} month={7} highlightedDays={releaseDaysIn(releases, 2026, 7)} />
                </div>
            </div>
        </div>
    );
}