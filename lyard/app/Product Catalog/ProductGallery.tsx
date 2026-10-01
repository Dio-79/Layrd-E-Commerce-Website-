"use client";

import Image from "next/image";
import { useState } from "react";

export type ProductImage = {
  /** Path under /public, e.g. "/products/fruit-salad-1.jpg". Leave out to show a placeholder. */
  src?: string;
  alt: string;
};

function JarPlaceholder() {
  return (
    <div className="grid size-full place-items-center bg-foreground text-gold">
      <svg viewBox="0 0 80 112" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="w-[38%]">
        <rect x="18" y="4" width="44" height="12" rx="2" />
        <path d="M14 20h52a4 4 0 0 1 4 4v78a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6V24a4 4 0 0 1 4-4z" />
        <path d="M10 44h60M10 62h60M10 80h60" strokeDasharray="3 4" />
        <circle cx="40" cy="62" r="12" />
      </svg>
    </div>
  );
}

export default function ProductGallery({ images }: { images: ProductImage[] }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="grid gap-6">
      <figure className="relative aspect-square overflow-hidden rounded-media border border-gold bg-foreground">
        {current?.src ? (
          <Image
            src={current.src}
            alt={current.alt}
            fill
            priority
            sizes="(min-width: 1024px) 56vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div role="img" aria-label={current?.alt ?? "Product photo"} className="size-full">
            <JarPlaceholder />
          </div>
        )}
      </figure>

      {images.length > 1 ? (
        <ul aria-label="Product images" className="flex flex-wrap gap-4">
          {images.map((image, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-current={i === active ? "true" : undefined}
                aria-label={`Show image ${i + 1}: ${image.alt}`}
                className={`relative block size-31 overflow-hidden rounded-media border-gold bg-foreground focus-visible:shadow-focus focus-visible:outline-none ${
                  i === active ? "border-2" : "border"
                }`}
              >
                {image.src ? (
                  <Image src={image.src} alt="" fill sizes="124px" className="object-cover" />
                ) : (
                  <JarPlaceholder />
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
