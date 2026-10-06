import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "menu"
  | "search"
  | "account"
  | "bag"
  | "archive"
  | "info"
  | "share"
  | "camera"
  | "minus"
  | "plus"
  | "arrow-right";

// 24px outline icons, 1.5 stroke — drawn to match the Figma's icons.
const PATHS: Record<IconName, ReactNode> = {
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  account: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c.8-3.9 3.8-6 7.5-6s6.7 2.1 7.5 6" />
    </>
  ),
  bag: (
    <>
      <path d="M4.5 8.5h15v11a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1z" />
      <path d="M8.5 8.5V7a3.5 3.5 0 0 1 7 0v1.5" />
    </>
  ),
  archive: (
    <>
      <rect x="3" y="4" width="18" height="4.5" rx="0.75" />
      <path d="M4.5 8.5V19a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V8.5M10 12.5h4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.75" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="18.5" r="2.5" />
      <path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1" />
    </>
  ),
  camera: (
    <>
      <path d="M3.5 8.5a1 1 0 0 1 1-1h3l1.5-2h6l1.5 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  minus: <path d="M6 12h12" />,
  plus: <path d="M12 6v12M6 12h12" />,
  "arrow-right": <path d="M5 12h14M13.5 6.5L19 12l-5.5 5.5" />,
};

type IconProps = {
  name: IconName;
  size?: number;
  /** Accessible name. Leave empty when the icon is decorative or its button has an aria-label. */
  title?: string;
} & Omit<SVGProps<SVGSVGElement>, "name">;

export default function Icon({ name, size = 24, title, strokeWidth = 1.5, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  );
}
