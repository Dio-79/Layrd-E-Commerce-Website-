// Shared Tailwind class names for the admin pages, so every page looks the same.
// Colours match the wholesale portal (gold #9b762e on warm off-white).

export const ui = {
    page: "space-y-6",
    pageHeader: "flex flex-wrap items-end justify-between gap-4",
    h1: "text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl",
    subtitle: "mt-1 text-sm text-zinc-600",
    breadcrumb: "mb-1 text-xs font-semibold uppercase tracking-[.14em] text-zinc-500",
    breadcrumbLink: "text-[#9b762e] hover:underline",

    card: "rounded-xl border border-zinc-200 bg-white p-5 shadow-sm",
    h2: "mb-4 text-lg font-bold text-zinc-900",
    h3: "mb-2 mt-5 text-sm font-bold text-zinc-800",
    eyebrow: "text-xs font-semibold uppercase tracking-[.14em] text-[#9b762e]",

    label: "block text-xs font-semibold uppercase tracking-wide text-zinc-500",
    input: "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-amber-500",
    smallInput: "w-24 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-amber-500",

    btn: "inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500",
    btnOutline: "inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50",
    btnSmall: "rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50",
    btnDanger: "rounded-md px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50",

    tableWrap: "overflow-x-auto",
    table: "w-full min-w-[640px] text-left text-sm",
    th: "border-b border-zinc-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500",
    td: "border-b border-zinc-100 px-3 py-3 align-middle",
    thumb: "h-10 w-10 rounded-md object-cover",

    checkRow: "flex items-start gap-3 rounded-lg p-2 hover:bg-zinc-50",
    checkbox: "mt-0.5 h-4 w-4 accent-[#9b762e]",
    tag: "inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-[#735413]",
};

// Shown when a product photo hasn't been added to public/images yet.
const PHOTO_PLACEHOLDER =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f4efe4"/>' +
        '<text x="50" y="47" font-family="Georgia,serif" font-size="12" letter-spacing="2" text-anchor="middle" fill="#9b762e">LÄYRD</text>' +
        '<text x="50" y="62" font-family="Arial,sans-serif" font-size="7" text-anchor="middle" fill="#a1a1aa">photo coming</text></svg>'
    );

/** <img onError={showPlaceholder} />: swaps a missing photo for the placeholder. */
export function showPlaceholder(e: { currentTarget: HTMLImageElement }) {
    if (e.currentTarget.src !== PHOTO_PLACEHOLDER) e.currentTarget.src = PHOTO_PLACEHOLDER;
}

const STATUS_COLOURS: Record<string, string> = {
    "in stock": "bg-emerald-50 text-emerald-700",
    "low stock": "bg-amber-50 text-amber-700",
    "out of stock": "bg-red-50 text-red-700",
    draft: "bg-zinc-100 text-zinc-600",
    hidden: "bg-zinc-100 text-zinc-600",
};

/** Coloured pill for a stock status like "In Stock" or "Low Stock". */
export function statusClass(status: string) {
    const colour = STATUS_COLOURS[status.toLowerCase()] ?? "bg-zinc-100 text-zinc-600";
    return `inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colour}`;
}
