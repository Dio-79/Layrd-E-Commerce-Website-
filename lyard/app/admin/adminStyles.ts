// Shared Tailwind class names for the admin pages, so every page looks the same.
// Dark charcoal with gold accents, from the team's Figma (low-fi & prototyping,
// "Admin Dashboard" / "Admin - Product Management" frames).

export const GOLD = "#e0b43a";

export const ui = {
    page: "space-y-6",
    pageHeader: "flex flex-wrap items-end justify-between gap-4",
    h1: "text-3xl font-semibold tracking-[.06em] text-white sm:text-4xl",
    subtitle: "mt-1 text-sm text-zinc-400",
    breadcrumb: "mb-1 text-xs font-medium text-zinc-400",
    breadcrumbLink: "text-[#e0b43a] underline-offset-2 hover:underline",

    card: "rounded-md border border-zinc-600 bg-[#3a3a3a] p-5 text-zinc-100 shadow-md shadow-black/20",
    h2: "mb-4 text-lg font-semibold tracking-wide text-white",
    h3: "mb-2 mt-5 text-sm font-semibold text-zinc-200",
    eyebrow: "text-xs font-semibold uppercase tracking-[.14em] text-[#e0b43a]",

    label: "block text-[11px] font-semibold uppercase tracking-wide text-zinc-300",
    input: "mt-1 w-full rounded-md border border-zinc-500 bg-[#2b2b2b] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-[#e0b43a]",
    smallInput: "w-24 rounded-md border border-zinc-500 bg-[#2b2b2b] px-2 py-1.5 text-sm text-zinc-100 focus-visible:outline-2 focus-visible:outline-[#e0b43a]",

    btn: "inline-flex items-center justify-center rounded-sm bg-[#e0b43a] px-4 py-2 text-sm font-semibold text-black hover:bg-[#ecc65a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
    btnOutline: "inline-flex items-center justify-center rounded-sm border border-[#e0b43a] bg-transparent px-4 py-2 text-sm font-semibold text-[#e0b43a] hover:bg-[#e0b43a]/10",
    btnSmall: "rounded-sm border border-zinc-500 px-2.5 py-1 text-xs font-semibold text-zinc-200 hover:border-[#e0b43a] hover:text-[#e0b43a]",
    btnDanger: "rounded-sm px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/10",

    tableWrap: "overflow-x-auto rounded-md border border-zinc-600",
    table: "w-full min-w-[640px] text-left text-sm",
    th: "border-b border-zinc-600 bg-[#2f2f2f] px-3 py-2.5 text-xs font-medium text-zinc-300",
    td: "border-b border-zinc-600/60 px-3 py-3 align-middle text-zinc-200",
    thumb: "h-10 w-10 rounded-sm object-cover",

    checkRow: "flex items-start gap-3 rounded-md p-2 hover:bg-white/5",
    checkbox: "mt-0.5 h-4 w-4 accent-[#e0b43a]",
    tag: "inline-flex items-center gap-1 rounded-sm border border-zinc-500 bg-[#2b2b2b] px-2.5 py-1 text-xs font-semibold text-zinc-100",
};

// Shown when a product photo hasn't been added to public/images yet.
const PHOTO_PLACEHOLDER =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#2b2b2b"/>' +
        '<text x="50" y="47" font-family="Georgia,serif" font-size="12" letter-spacing="2" text-anchor="middle" fill="#e0b43a">LÄYRD</text>' +
        '<text x="50" y="62" font-family="Arial,sans-serif" font-size="7" text-anchor="middle" fill="#a1a1aa">photo coming</text></svg>'
    );

/** <img onError={showPlaceholder} />: swaps a missing photo for the placeholder. */
export function showPlaceholder(e: { currentTarget: HTMLImageElement }) {
    if (e.currentTarget.src !== PHOTO_PLACEHOLDER) e.currentTarget.src = PHOTO_PLACEHOLDER;
}

// Outlined pills, as in the Figma status column.
const STATUS_COLOURS: Record<string, string> = {
    "in stock": "border-zinc-400 text-zinc-200",
    "low stock": "border-[#e0b43a] text-[#e0b43a]",
    "out of stock": "border-red-400 text-red-400",
    draft: "border-zinc-500 text-zinc-400",
    hidden: "border-zinc-500 text-zinc-400",
};

/** Coloured pill for a stock status like "In Stock" or "Low Stock". */
export function statusClass(status: string) {
    const colour = STATUS_COLOURS[status.toLowerCase()] ?? "border-zinc-500 text-zinc-300";
    return `inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${colour}`;
}
