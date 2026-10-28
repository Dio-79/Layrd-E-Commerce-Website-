"use client";

import { useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import { useAuth } from "@/app/context/AuthContext";
import { ROUTES } from "@/lib/Routes/Routes";
import Footer from "../components/Footer";
import styles from "./Account.module.css";
import { useCustomerProfile } from "./Usecustomerprofile";
import ProfilePanel from "./Profilepanel";
import PaymentPanel from "./Paymentpanel";
import SecurityPanel from "./Securitypanel";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "payment", label: "Payment method" },
  { id: "security", label: "Security" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AccountSettings() {
  const { identity, profile, loading, save } = useCustomerProfile();
  const { signOut } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("profile");
  const [loggingOut, setLoggingOut] = useState(false);

  const logOut = async () => {
    setLoggingOut(true);
    await signOut();
    router.replace(ROUTES.login);
  };

  // Arrow keys / Home / End move between the tabs
  const onTabKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const index = TABS.findIndex((t) => t.id === tab);
    let nextIndex = index;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") nextIndex = (index + 1) % TABS.length;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") nextIndex = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = TABS.length - 1;
    else return;

    e.preventDefault();
    const nextTab = TABS[nextIndex].id;
    setTab(nextTab);
    document.getElementById(`account-tab-${nextTab}`)?.focus();
  };

  return (
    <>
      <Header />

      <main className={styles.page}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Account settings</h1>
          {identity && (
            <button type="button" className={styles.logout} onClick={logOut} disabled={loggingOut}>
              {loggingOut ? "Logging out…" : "Log out"}
            </button>
          )}
        </div>

        {!identity ? (
          <p className={styles.notice}>
            <Link href="/login">Sign in</Link> to manage your account.
          </p>
        ) : loading || !profile ? (
          <p className={styles.notice} role="status">
            Loading your account…
          </p>
        ) : (
          <div className={styles.layout}>
            <div
              className={styles.tabs}
              role="tablist"
              aria-orientation="vertical"
              aria-label="Account sections"
              onKeyDown={onTabKeyDown}
            >
              {TABS.map((t) => (
                <button
                  key={t.id}
                  id={`account-tab-${t.id}`}
                  type="button"
                  role="tab"
                  className={styles.tab}
                  aria-selected={tab === t.id}
                  aria-controls={`account-panel-${t.id}`}
                  tabIndex={tab === t.id ? 0 : -1}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div
              id={`account-panel-${tab}`}
              role="tabpanel"
              aria-labelledby={`account-tab-${tab}`}
              className={styles.panelWrap}
            >
              {tab === "profile" && <ProfilePanel key={identity} profile={profile} onSave={save} />}
              {tab === "payment" && <PaymentPanel key={identity} profile={profile} onSave={save} />}
              {tab === "security" && <SecurityPanel key={identity} profile={profile} />}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}