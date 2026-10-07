"use client";

import React, { useState } from "react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import SelectionForms from "./forms-slots";
import Calculation from "./calculation";
import Button from "./button";
import styles from "./page_4.module.css";

export default function MixAndMatchBundlePage() {
  const [selectedSize, setSelectedSize] = useState<"SMALL" | "REGULAR" | "LARGE">("SMALL");
  const [quantity, setQuantity] = useState(1);

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.mainContent}>
        <div className={styles.leftColumn}>
          {/* Bundle Item Slots with Button sub-component */}
          <div className={styles.bundleList}>
            <div className={styles.bundleSlotCard}>
              <div className={styles.bundleSlotItem}>
                <div className={styles.slotImageFrame}>
                  <img src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&auto=format&fit=crop" alt="Oreo Cheesecake" />
                </div>
                <span className={styles.slotTitle}>Oreo Cheesecake</span>
              </div>
            </div>

            <div className={styles.bundleSlotCard}>
              <div className={styles.bundleSlotItem}>
                <div className={styles.slotImageFrame}>
                  <img src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop" alt="Fruit Salad" />
                </div>
                <span className={styles.slotTitle}>Fruit salad</span>
              </div>
              <Button />
            </div>

            <div className={styles.bundleSlotCard}>
              <div className={styles.bundleSlotItem}>
                <div className={styles.slotImageFrame}>
                  <img src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&auto=format&fit=crop" alt="Oreo Cheesecake" />
                </div>
                <span className={styles.slotTitle}>Oreo Cheesecake</span>
              </div>
              <Button />
            </div>
          </div>

          {/* Form & Pricing Calculation controls */}
          <div className={styles.controlsGrid}>
            <div>
              <SelectionForms />
              <div className={styles.priceBox}>Price: $29.33</div>
            </div>

            <div className={styles.sizeSelectorGroup}>
              <span className={styles.sizeLabel}>SIZE</span>
              <div className={styles.sizeButtons}>
                {(["SMALL", "REGULAR", "LARGE"] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    className={`${styles.sizeOptionBtn} ${selectedSize === sz ? styles.activeSize : ""}`}
                    onClick={() => setSelectedSize(sz)}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              <div className={styles.addToBagRow}>
                <div className={styles.quantityStepper}>
                  <button type="button" className={styles.stepperBtn} onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                    -
                  </button>
                  <span className={styles.stepperValue}>{quantity}</span>
                  <button type="button" className={styles.stepperBtn} onClick={() => setQuantity((q) => q + 1)}>
                    +
                  </button>
                </div>
                <button type="button" className={styles.addToBagBtn}>
                  ADD TO BAG +
                </button>
              </div>
            </div>
          </div>

          {/* Dedicated Dynamic Calculation sub-component */}
          <div style={{ marginTop: "24px" }}>
            <Calculation />
          </div>
        </div>

        {/* Sidebar Recommendations */}
        <aside className={styles.rightSidebar}>
          <div className={styles.sidebarTitle}>RECOMMENDATION</div>
          <div className={styles.recommendationCard}>
            <img src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop" alt="Rec 1" />
          </div>
          <div className={styles.recommendationCard}>
            <img src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop" alt="Rec 2" />
          </div>
          <div className={styles.recommendationCard}>
            <img src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&auto=format&fit=crop" alt="Rec 3" />
          </div>
        </aside>
      </main>

      <Footer />
    </div>
  );
}