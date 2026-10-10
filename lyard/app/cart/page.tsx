'use client';

import Image from "next/image";
import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Product } from "../types/models";
import styles from "./cart.module.css";
const FEATURED_PRODUCTS: Product[] = [];

export default function LandingPageBody() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <>
      <Header />

      <div className={styles.bodyWrapper}>
        {/* 1. Hero Section */}
        <section className={styles.heroSection}>
          <h2 className={styles.heroTitle}>
            ESPRESSO SHOTS &<br />
            CAKE-IN-A-CAN
          </h2>
          <p className={styles.heroSubtitle}>
            MADE FRESH. KEPT SIMPLE.
            <br />
            Delicious non-standard products handcrafted from pure and simple ingredients.
            <br />
            Delivered in our signature packaging.
          </p>
          <button type="button" className={styles.heroCtaBtn}>
            EXPLORE OUR COLLECTION
          </button>
        </section>

        {/* 2. Featured Collection Section */}
        <section className={styles.featuredSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              OUR <span className={styles.highlightText}>FEATURED</span> COLLECTION
            </h3>
            <span className={styles.viewAllLink}>VIEW ALL PRODUCTS ↗</span>
          </div>

          <div className={styles.productGrid}>
            {FEATURED_PRODUCTS.map((product) => (
              <div key={product.name} className={styles.productCard}>
                <div>
                  <div className={styles.imageContainer}>
                    {product.price && <span className={styles.cardBadge}>{product.name}</span>}
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={400}
                      height={300}
                      unoptimized
                    />
                  </div>
                  <h4 className={styles.cardTitle}>{product.name}</h4>
                  <p className={styles.cardDescription}>{product.description}</p>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.priceTag}>FROM {product.price}</span>
                  <button
                    type="button"
                    className={styles.detailsBtn}
                    onClick={() => setSelectedProduct(product)}
                  >
                    DETAILS
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Value Proposition Banner */}
        <section className={styles.valueSection}>
          <div className={styles.valueContainer}>
            <div>
              <h3 className={styles.valueTitle}>PREMIUM. SIMPLE. ELEVATED.</h3>

              <div className={styles.valueFeatureList}>
                <div className={styles.valueItem}>
                  <span className={styles.featureIcon}>🥫</span>
                  <div>
                    <h4 className={styles.featureHeading}>PREMIUM CAKES-IN-A-CAN</h4>
                    <p className={styles.featureText}>
                      Our unique cake-in-a-can packaging keeps every bite perfectly fresh, ready to enjoy
                      anywhere without mess or hassle.
                    </p>
                  </div>
                </div>

                <div className={styles.valueItem}>
                  <span className={styles.featureIcon}>🥛</span>
                  <div>
                    <h4 className={styles.featureHeading}>SIMPLE, FRESH INGREDIENTS</h4>
                    <p className={styles.featureText}>
                      Made without artificial preservatives or additives. Just clean, premium
                      ingredients crafted daily.
                    </p>
                  </div>
                </div>

                <div className={styles.valueItem}>
                  <span className={styles.featureIcon}>☕</span>
                  <div>
                    <h4 className={styles.featureHeading}>ESPRESSO, ELEVATED</h4>
                    <p className={styles.featureText}>
                      Rich, concentrated espresso shots packed for maximum flavor, ready for cold or hot
                      preparation.
                    </p>
                  </div>
                </div>
              </div>

              <button type="button" className={styles.shopNowBtn}>
                SHOP NOW
              </button>
            </div>

            <div className={styles.valueImages}>
              <Image
                src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop"
                alt="Feature Cake Can"
                className={styles.valueImgMain}
                width={600}
                height={420}
                unoptimized
              />
              <Image
                src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop"
                alt="Feature Espresso"
                className={styles.valueImgSub}
                width={400}
                height={300}
                unoptimized
              />
            </div>
          </div>
        </section>

        {/* 4. Social Gallery Section */}
        <section className={styles.socialSection}>
          <h3 className={styles.socialHandle}>@l.a.y.r.d</h3>
          <p className={styles.socialTagline}>Share your moments with LÄYRD</p>

          <div className={styles.socialGrid}>
            <div className={styles.socialCard}>
              <Image
                src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop"
                alt="Social 1"
                width={400}
                height={300}
                unoptimized
              />
            </div>
            <div className={styles.socialCard}>
              <Image
                src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&auto=format&fit=crop"
                alt="Social 2"
                width={400}
                height={300}
                unoptimized
              />
            </div>
            <div className={styles.socialCard}>
              <Image
                src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop"
                alt="Social 3"
                width={400}
                height={300}
                unoptimized
              />
            </div>
          </div>

          <a href="https://instagram.com" className={styles.instagramFooterLink}>
            <span>📸</span> Follow us on our Instagram for more announcements !
          </a>
        </section>

        {/* Details Modal */}
        {selectedProduct && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalBox}>
              <h3 style={{ margin: "0 0 8px 0" }}>{selectedProduct.name}</h3>
              <p style={{ fontSize: "12px", color: "#666" }}>{selectedProduct.description}</p>
              <div style={{ fontWeight: "bold", margin: "12px 0" }}>{selectedProduct.price}</div>
              <button
                type="button"
                style={{
                  backgroundColor: "#000",
                  color: "#fff",
                  border: "none",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
                onClick={() => setSelectedProduct(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}