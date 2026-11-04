// Shared Tailwind class names for the admin pages, so every page looks the same.
// Dark charcoal with gold accents, from the team's Figma (low-fi & prototyping,
// "Admin Dashboard" / "Admin - Product Management" frames).

export const GOLD = "#e0b43a";

// Every admin colour is a CSS variable (--a-*) set on the layout, so the
// moon/sun button in the top bar can switch between the two themes.
// Dark is the Figma design; light keeps the same gold, darkened for contrast.
export type AdminTheme = "dark" | "light";

export const THEMES: Record<AdminTheme, Record<string, string>> = {
    dark: {
        "--a-page": "#2b2b2b",
        "--a-panel": "#262626",
        "--a-card": "#3a3a3a",
        "--a-inset": "#2b2b2b",
        "--a-th": "#2f2f2f",
        "--a-border": "#52525b",
        "--a-strong": "#71717a",
        "--a-text": "#f4f4f5",
        "--a-text-2": "#e4e4e7",
        "--a-muted": "#a1a1aa",
        "--a-faint": "#71717a",
        "--a-gold": "#e0b43a",
        "--a-gold-hover": "#ecc65a",
        "--a-hover": "rgba(255,255,255,0.05)",
        "--a-danger": "#f87171",
    },
    light: {
        "--a-page": "#f7f4ee",
        "--a-panel": "#ffffff",
        "--a-card": "#ffffff",
        "--a-inset": "#faf8f4",
        "--a-th": "#f1ede4",
        "--a-border": "#e2ddd2",
        "--a-strong": "#c9c3b6",
        "--a-text": "#18181b",
        "--a-text-2": "#3f3f46",
        "--a-muted": "#63636b",
        "--a-faint": "#8a8a93",
        "--a-gold": "#b8901f",
        "--a-gold-hover": "#cba233",
        "--a-hover": "rgba(0,0,0,0.04)",
        "--a-danger": "#dc2626",
    },
};

export const ui = {
    page: "space-y-6",
    pageHeader: "flex flex-wrap items-end justify-between gap-4",
    h1: "text-3xl font-semibold tracking-[.06em] text-[var(--a-text)] sm:text-4xl",
    subtitle: "mt-1 text-sm text-[var(--a-muted)]",
    breadcrumb: "mb-1 text-xs font-medium text-[var(--a-muted)]",
    breadcrumbLink: "text-[var(--a-gold)] underline-offset-2 hover:underline",

    card: "rounded-md border border-[var(--a-border)] bg-[var(--a-card)] p-5 text-[var(--a-text)] shadow-md shadow-black/20",
    h2: "mb-4 text-lg font-semibold tracking-wide text-[var(--a-text)]",
    h3: "mb-2 mt-5 text-sm font-semibold text-[var(--a-text-2)]",
    eyebrow: "text-xs font-semibold uppercase tracking-[.14em] text-[var(--a-gold)]",

    label: "block text-[11px] font-semibold uppercase tracking-wide text-[var(--a-text-2)]",
    input: "mt-1 w-full rounded-md border border-[var(--a-strong)] bg-[var(--a-inset)] px-3 py-2 text-sm text-[var(--a-text)] placeholder:text-[var(--a-faint)] focus-visible:outline-2 focus-visible:outline-[var(--a-gold)]",
    smallInput: "w-24 rounded-md border border-[var(--a-strong)] bg-[var(--a-inset)] px-2 py-1.5 text-sm text-[var(--a-text)] focus-visible:outline-2 focus-visible:outline-[var(--a-gold)]",

    btn: "inline-flex items-center justify-center rounded-sm bg-[var(--a-gold)] px-4 py-2 text-sm font-semibold text-black hover:bg-[var(--a-gold-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--a-text)]",
    btnOutline: "inline-flex items-center justify-center rounded-sm border border-[var(--a-gold)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--a-gold)] hover:bg-[var(--a-gold)]/10",
    btnSmall: "rounded-sm border border-[var(--a-strong)] px-2.5 py-1 text-xs font-semibold text-[var(--a-text-2)] hover:border-[var(--a-gold)] hover:text-[var(--a-gold)]",
    btnDanger: "rounded-sm px-2.5 py-1 text-xs font-semibold text-[var(--a-danger)] hover:bg-[var(--a-danger)]/10",

    tableWrap: "overflow-x-auto rounded-md border border-[var(--a-border)]",
    table: "w-full min-w-[640px] text-left text-sm",
    th: "border-b border-[var(--a-border)] bg-[var(--a-th)] px-3 py-2.5 text-xs font-medium text-[var(--a-text-2)]",
    td: "border-b border-[var(--a-border)] px-3 py-3 align-middle text-[var(--a-text-2)]",
    thumb: "h-10 w-10 rounded-sm object-cover",

    checkRow: "flex items-start gap-3 rounded-md p-2 hover:bg-[var(--a-hover)]",
    checkbox: "mt-0.5 h-4 w-4 accent-[var(--a-gold)]",
    tag: "inline-flex items-center gap-1 rounded-sm border border-[var(--a-strong)] bg-[var(--a-inset)] px-2.5 py-1 text-xs font-semibold text-[var(--a-text)]",
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
    "in stock": "border-[var(--a-strong)] text-[var(--a-text-2)]",
    "low stock": "border-[var(--a-gold)] text-[var(--a-gold)]",
    "out of stock": "border-[var(--a-danger)] text-[var(--a-danger)]",
    draft: "border-[var(--a-strong)] text-[var(--a-muted)]",
    hidden: "border-[var(--a-strong)] text-[var(--a-muted)]",
};

/** Coloured pill for a stock status like "In Stock" or "Low Stock". */
export function statusClass(status: string) {
    const colour = STATUS_COLOURS[status.toLowerCase()] ?? "border-[var(--a-strong)] text-[var(--a-text-2)]";
    return `inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${colour}`;
}
