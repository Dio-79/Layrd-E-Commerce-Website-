'use client';

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "./cart.module.css";
import ProductRow from "./featuredcollection";

/** Where "View all products" goes. Use the same path your header's CAKE-IN-A-CAN link uses. */
const CAKE_IN_A_CAN_PATH = "/products";

export default function LandingPageBody() {
  const featuredRef = useRef<HTMLElement>(null);

  // Smooth-scrolls down to the featured collection (instant if the visitor prefers reduced motion)
  const scrollToFeatured = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    featuredRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

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
          <button type="button" className={styles.heroCtaBtn} onClick={scrollToFeatured}>
            EXPLORE OUR COLLECTION
          </button>
        </section>

        {/* 2. Featured Collection Section */}
        <section ref={featuredRef} id="featured" className={styles.featuredSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              OUR <span className={styles.highlightText}>FEATURED</span> COLLECTION
            </h3>
            <Link href={CAKE_IN_A_CAN_PATH} className={styles.viewAllLink}>
              VIEW ALL PRODUCTS ↗
            </Link>
          </div>

          <div className={styles.productGrid}>
            <ProductRow />
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

              <Link href={CAKE_IN_A_CAN_PATH} className={styles.shopNowBtn}>
                SHOP NOW
              </Link>
            </div>

            <div className={styles.valueImages}>
              <Image
                src="/home/kitchen-jars.jpg"
                alt="Four LÄYRD cakes-in-a-can on a kitchen counter"
                className={styles.valueImgMain}
                width={600}
                height={420}
                unoptimized
              />
              <Image
                src="/home/gift-stack.jpg"
                alt="LÄYRD cakes-in-a-can stacked and tied with a ribbon"
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
                src="/home/gift-bag.jpg"
                alt="A LÄYRD carry tray with cakes-in-a-can, outdoors"
                width={400}
                height={300}
                unoptimized
              />
            </div>
            <div className={styles.socialCard}>
              <Image
                src="/home/jar-in-box.jpg"
                alt="A LÄYRD cake-in-a-can presented in its gift box"
                width={400}
                height={300}
                unoptimized
              />
            </div>
            <div className={styles.socialCard}>
              <Image
                src="/home/bow-stack.jpg"
                alt="LÄYRD gift stack with a satin bow"
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
      </div>
      <Footer />
    </>
  );
}