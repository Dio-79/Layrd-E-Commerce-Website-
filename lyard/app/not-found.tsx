import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { ROUTES } from "@/lib/Routes/Routes";

// Shown for any URL that doesn't exist (instead of Next.js's plain black 404 page).
export default function NotFound() {
  return (
    <>
      <Header />
      <main
        style={{
          minHeight: "60vh",
          display: "grid",
          placeContent: "center",
          gap: "1rem",
          padding: "3rem 1rem",
          textAlign: "center",
          fontFamily: "Montserrat, system-ui, sans-serif",
          color: "#111",
          background: "#fff",
        }}
      >
        <p style={{ margin: 0, color: "#d9a21b", fontWeight: 700, letterSpacing: "0.2em" }}>404</p>
        <h1 style={{ margin: 0, fontSize: "clamp(1.6rem, 4vw, 2.4rem)", letterSpacing: "0.12em" }}>PAGE NOT FOUND</h1>
        <p style={{ margin: 0, color: "#555" }}>That page doesn&apos;t exist or has moved.</p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.5rem" }}>
          <Link
            href={ROUTES.main}
            style={{ padding: "0.7rem 1.4rem", background: "#000", color: "#fff", textDecoration: "none", fontWeight: 600 }}
          >
            BACK TO THE SHOP
          </Link>
          <Link
            href={ROUTES.drinks}
            style={{ padding: "0.7rem 1.4rem", border: "1px solid #000", color: "#000", textDecoration: "none", fontWeight: 600 }}
          >
            SEE DRINKS
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
