// Social media for the home page (FR-22). Set these in .env.local:
//   NEXT_PUBLIC_INSTAGRAM_HANDLE=l.a.y.r.d
//   NEXT_PUBLIC_INSTAGRAM_POSTS=https://www.instagram.com/p/AAA/,https://www.instagram.com/p/BBB/
//   NEXT_PUBLIC_TIKTOK_HANDLE=layrd
//   NEXT_PUBLIC_TIKTOK_VIDEOS=https://www.tiktok.com/@layrd/video/123...
// Posts and videos use the official Instagram / TikTok embeds. With none set,
// the home page shows its own photo grid and a link to the profile.
const list = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^https:\/\/(www\.)?(instagram\.com|tiktok\.com)\//.test(s));

export const INSTAGRAM_HANDLE = process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || "l.a.y.r.d";
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;
export const INSTAGRAM_POSTS = list(process.env.NEXT_PUBLIC_INSTAGRAM_POSTS);

export const TIKTOK_HANDLE = (process.env.NEXT_PUBLIC_TIKTOK_HANDLE ?? "").replace(/^@/, "");
export const TIKTOK_URL = TIKTOK_HANDLE ? `https://www.tiktok.com/@${TIKTOK_HANDLE}` : "";
export const TIKTOK_VIDEOS = list(process.env.NEXT_PUBLIC_TIKTOK_VIDEOS);

/** "https://www.tiktok.com/@x/video/123?..." -> "123" */
export const tiktokVideoId = (url: string) => url.match(/\/video\/(\d+)/)?.[1] ?? "";
