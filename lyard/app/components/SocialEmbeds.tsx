"use client";

// Instagram posts and TikTok videos on the home page (FR-22), using the official
// embed code. The embed scripts load only when this section scrolls near the
// screen, after the page itself has loaded (NFR-4), so they never slow it down.
import { useEffect, useRef, useState } from "react";
import { INSTAGRAM_POSTS, TIKTOK_VIDEOS, TIKTOK_URL, TIKTOK_HANDLE, tiktokVideoId } from "@/lib/Intergration/social";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

function loadScript(src: string) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement("script");
  s.src = src;
  s.async = true;
  document.body.appendChild(s);
}

export default function SocialEmbeds() {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const any = INSTAGRAM_POSTS.length > 0 || TIKTOK_VIDEOS.length > 0;

  useEffect(() => {
    if (!any || !ref.current) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setNear(true), { rootMargin: "400px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [any]);

  useEffect(() => {
    if (!near) return;
    if (INSTAGRAM_POSTS.length) {
      loadScript("https://www.instagram.com/embed.js");
      window.instgrm?.Embeds.process();
    }
    if (TIKTOK_VIDEOS.length) loadScript("https://www.tiktok.com/embed.js");
  }, [near]);

  if (!any) return null;

  return (
    <div ref={ref} style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center", margin: "1.5rem 0" }}>
      {near &&
        INSTAGRAM_POSTS.map((url) => (
          <blockquote key={url} className="instagram-media" data-instgrm-permalink={url} data-instgrm-version="14"
            style={{ maxWidth: 400, minWidth: 280, width: "100%", margin: 0 }}>
            <a href={url} target="_blank" rel="noopener noreferrer">View this post on Instagram</a>
          </blockquote>
        ))}
      {near &&
        TIKTOK_VIDEOS.map((url) => (
          <blockquote key={url} className="tiktok-embed" cite={url} data-video-id={tiktokVideoId(url)} style={{ maxWidth: 400, minWidth: 280, margin: 0 }}>
            <section>
              <a href={TIKTOK_URL || url} target="_blank" rel="noopener noreferrer">{TIKTOK_HANDLE ? `@${TIKTOK_HANDLE}` : "Watch on TikTok"}</a>
            </section>
          </blockquote>
        ))}
    </div>
  );
}
