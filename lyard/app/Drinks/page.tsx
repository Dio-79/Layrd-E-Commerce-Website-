"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import checkout from "../check-out/checkout.module.css"; // shared shell + sidebar styles
import styles from "./drinks.module.css";
import { BagSummaryLine, TotalsList, useOrderLines } from "../check-out/order";
import { useCart } from "@/app/context/CartContext";
import { useCheckout } from "@/lib/checkout/checkoutStore";
import { calculateTotals, findPromo, formatMoney } from "@/lib/checkout/CheckoutPricing";
import {
  availableOptions,
  EMPTY_FILTERS,
  filterProducts,
  getProductsBySection,
  type Filters,
} from "@/lib/catelog/data";
import { ROUTES } from "@/lib/Routes/Routes";

export default function DrinksPage() {
  const { addItem } = useCart();
  const { bag, lines, ready } = useOrderLines();
  const { promoCode } = useCheckout();

  const drinks = useMemo(() => getProductsBySection("drinks"), []);
  const options = useMemo(() => availableOptions(drinks), [drinks]);

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [justAdded, setJustAdded] = useState<number | null>(null);

  const visible = useMemo(() => filterProducts(drinks, filters), [drinks, filters]);
  const hasFilters = Object.values(filters).some((v) => v.length > 0);

  const toggle = <K extends keyof Filters>(key: K, value: Filters[K][number]) =>
    setFilters((f) => {
      const list = f[key] as Filters[K][number][];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...f, [key]: next };
    });

  const groups: { title: string; key: keyof Filters; items: { value: string; label: string }[] }[] = [
    { title: "Categories", key: "categories", items: options.categories.map((c) => ({ value: c, label: c })) },
    { title: "Price", key: "prices", items: options.prices.map((r) => ({ value: r.id, label: r.label })) },
    { title: "Size", key: "sizes", items: options.sizes.map((s) => ({ value: s, label: s })) },
    { title: "Flavor Profile", key: "flavors", items: options.flavors.map((f) => ({ value: f, label: f })) },
  ];

  const promo = promoCode ? findPromo(promoCode) : null;
  const totals = useMemo(() => calculateTotals(lines, null, promo), [lines, promo]);

  const add = (drink: (typeof drinks)[number]) => {
    addItem(drink);
    setJustAdded(drink.productID);
    window.setTimeout(() => setJustAdded((cur) => (cur === drink.productID ? null : cur)), 1200);
  };

  return (
    <>
      <Header />

      <main className={checkout.page}>
        <h1 className={checkout.srOnly}>Drinks</h1>

        <div className={checkout.layout}>
          {/* ------------------------- Left column ------------------------- */}
          <div className={checkout.left}>
            {/* Filters */}
            <section className={checkout.section}>
              <div className={styles.sectionHead}>
                <h2>Filter Drinks</h2>
                {hasFilters && (
                  <button type="button" className={checkout.returnCart} onClick={() => setFilters(EMPTY_FILTERS)}>
                    Clear all
                  </button>
                )}
              </div>

              {groups.map(
                (g) =>
                  g.items.length > 0 && (
                    <div key={g.key} className={styles.filterGroup} role="group" aria-label={g.title}>
                      <span className={styles.filterTitle}>{g.title}</span>
                      <div className={styles.typeOptions}>
                        {g.items.map((item) => {
                          const on = (filters[g.key] as string[]).includes(item.value);
                          return (
                            <button
                              key={item.value}
                              type="button"
                              className={`${checkout.deliveryOption} ${styles.typeOption} ${on ? checkout.selected : ""}`}
                              aria-pressed={on}
                              onClick={() => toggle(g.key, item.value as never)}
                            >
                              <strong>{item.label}</strong>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )
              )}
            </section>

            {/* Drinks */}
            <section className={checkout.section}>
              <h2>
                Drinks <span className={styles.count}>({visible.length})</span>
              </h2>

              {visible.length === 0 ? (
                <p className={checkout.note}>No drinks match those filters.</p>
              ) : (
                <ul className={styles.grid}>
                  {visible.map((drink) => {
                    const image = drink.imageUrl;
                    const added = justAdded === drink.productID;
                    return (
                      <li key={drink.productID} className={styles.card}>
                        <div className={styles.imageWrap}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {image ? <img src={image} alt={drink.name} /> : null}
                        </div>
                        <div className={styles.cardBody}>
                          <h3>{drink.name}</h3>
                          {drink.description && <p className={checkout.note}>{drink.description}</p>}
                          <div className={styles.cardFoot}>
                            <span className={styles.price}>{formatMoney(drink.price)}</span>
                            <button
                              type="button"
                              className={`${styles.addBtn} ${added ? styles.added : ""}`}
                              onClick={() => add(drink)}
                              aria-label={`Add ${drink.name} to bag`}
                            >
                              {added ? "ADDED ✓" : "ADD"}
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* ------------------------ Bag sidebar ------------------------ */}
          <aside className={checkout.summary} aria-labelledby="bag-title">
            <h2 id="bag-title" className={checkout.summaryTitle}>
              Your Bag
            </h2>

            {!ready ? null : bag.length === 0 ? (
              <p className={checkout.empty}>Your bag is empty. Add a drink to get started.</p>
            ) : (
              <div className={checkout.group}>
                <h3 className={checkout.groupTitle}>Drinks</h3>
                <ul className={checkout.lines}>
                  {bag.map((line) => (
                    <BagSummaryLine key={line.id} line={line} />
                  ))}
                </ul>
              </div>
            )}

            <TotalsList totals={totals} shippingLabel="Calculated at Checkout" promoCode={promo?.code} />

            <Link
              href={ROUTES.cart}
              className={checkout.complete}
              aria-disabled={bag.length === 0}
              style={bag.length === 0 ? { opacity: 0.55, pointerEvents: "none" } : undefined}
            >
              VIEW BAG
            </Link>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}