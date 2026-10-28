"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "./Search.module.css";
import { searchItems } from "@/lib/Search/search";
import { getSearchItems } from "@/lib/Search/Searchindex";
import { ROUTES } from "@/lib/Routes/Routes";

const money = (n: number) => `$${n.toFixed(2)}`;

function SearchForm({ initial }: { initial: string }) {
  const router = useRouter();

  return (
    <form
      role="search"
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        const value = new FormData(e.currentTarget).get("q");
        const q = typeof value === "string" ? value.trim() : "";
        router.push(q ? `${ROUTES.search}?q=${encodeURIComponent(q)}` : ROUTES.search);
      }}
    >
      <label htmlFor="search-q" className={styles.srOnly}>
        Search the store
      </label>
      <input
        id="search-q"
        name="q"
        type="search"
        className={styles.input}
        placeholder="Search products…"
        defaultValue={initial}
        autoComplete="off"
      />
      <button type="submit" className={styles.go}>
        Search
      </button>
    </form>
  );
}

export default function SearchResults() {
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim();

  const items = useMemo(() => getSearchItems(), []);
  const results = useMemo(() => searchItems(items, q), [items, q]);

  return (
    <>
      <Header />

      <main className={styles.page}>
        <h1 className={styles.title}>Search</h1>

        {/* key makes the box reset when the address changes */}
        <SearchForm key={q} initial={q} />

        {q === "" ? (
          <p className={styles.note}>Type a drink, flavor or product name to search.</p>
        ) : (
          <>
            <p className={styles.count} role="status">
              {results.length} {results.length === 1 ? "result" : "results"} for “{q}”
            </p>

            {results.length === 0 ? (
              <div className={styles.empty}>
                <p>We couldn&apos;t find anything for “{q}”. Check the spelling or try a shorter word.</p>
                <p>
                  Or browse: <Link href={ROUTES.drinks}>Drinks</Link>,{" "}
                  <Link href={ROUTES.cakeInACan}>Cake-in-a-Can</Link>, <Link href={ROUTES.bundles}>Bundles</Link>.
                </p>
              </div>
            ) : (
              <ul className={styles.grid}>
                {results.map((item) => (
                  <li key={item.id} className={styles.card}>
                    <div className={styles.image}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {item.imageUrl ? <img src={item.imageUrl} alt="" /> : null}
                      {item.tag && <span className={styles.tag}>{item.tag}</span>}
                    </div>
                    <div className={styles.body}>
                      <p className={styles.category}>{item.category}</p>
                      <h2 className={styles.name}>
                        <Link href={item.href}>{item.name}</Link>
                      </h2>
                      {item.description && <p className={styles.desc}>{item.description}</p>}
                      {item.price !== undefined && <p className={styles.price}>From {money(item.price)}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>

      <Footer />
    </>
  );
}