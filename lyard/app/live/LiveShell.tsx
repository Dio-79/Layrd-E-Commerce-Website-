"use client";

// The frame both live pages share: the site's header and footer, Montserrat,
// and a title bar with the live status (same look as the shop page).
import type { ReactNode } from "react";
import { Montserrat } from "next/font/google";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import styles from "./live.module.css";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export function LiveShell({
  title,
  subtitle,
  aside,
  children,
}: {
  title: string;
  subtitle?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`${montserrat.variable} ${styles.shell}`}>
      <Header />
      <main className={styles.page}>
        <header className={styles.titleBar}>
          <div>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {aside}
        </header>
        {children}
      </main>
      <Footer />
    </div>
  );
}
