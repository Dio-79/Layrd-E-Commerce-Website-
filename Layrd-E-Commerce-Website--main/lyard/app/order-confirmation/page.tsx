"use client";

import { useRouter } from "next/navigation";

export default function OrderConfirmationPage() {
  const router = useRouter();

  return (
    <div className="confirmation-page">

      {/* Announcement Bar */}
      <div className="announcement-bar">
        NEW LIMITED EDITION FLAVORS OUT THIS WEEKEND! • LEARN MORE
      </div>

      {/* Header */}
      <header className="site-header">

        <div className="header-top">

          <button
            className="menu-button"
            aria-label="Menu"
          >
            ☰
          </button>

          <div className="site-logo">
            LÄYRD
          </div>

          <div className="header-icons">
            <span>⌕</span>
            <span>♙</span>
            <span>♧</span>
          </div>

        </div>

        <nav className="main-nav">
          <a href="#">DRINKS</a>
          <a href="#">CAKE-IN-A-CAN</a>
          <a href="#">BUNDLES</a>
          <a href="#">EVENT ORDERING</a>
          <a href="#">MORE</a>
        </nav>

      </header>

      {/* Confirmation Content */}
      <main className="confirmation-main">

        <div className="confirmation-content">

          <h1>Order Confirmed</h1>

          <p className="confirmation-message">
            Thank you for your order. We are preparing your selections
            <br />
            with care.
          </p>

          {/* Order information */}
          <div className="order-information">

            <div>
              <span>ORDER NUMBER</span>
              <strong>#ORD-124</strong>
            </div>

            <div>
              <span>DoorDash Delivery Estimate</span>
              <strong>Today, 9:15 - 9:32 PM</strong>
            </div>

          </div>

          {/* Order Summary */}
          <div className="confirmation-summary">

            <h2>Order Summary</h2>

            <div className="confirmation-item">

              <div className="confirmation-image">
                🥗
              </div>

              <div className="confirmation-item-info">
                <strong>Fruit Salad</strong>
                <small>Standard Size</small>
                <small>×6</small>
              </div>

              <strong>$44.00</strong>

            </div>

            <div className="confirmation-item">

              <div className="confirmation-image">
                ☕
              </div>

              <div className="confirmation-item-info">
                <strong>Double Espresso</strong>
                <small>Sweetness: Sugar</small>
                <small>×1</small>
              </div>

              <strong>$4.00</strong>

            </div>

            <div className="confirmation-line">
              <span>Subtotal</span>
              <span>$48.00</span>
            </div>

            <div className="confirmation-line">
              <span>Shipping</span>
              <span>$1.99</span>
            </div>

            <div className="confirmation-line">
              <span>Estimated Tax</span>
              <span>$2.40</span>
            </div>

            <div className="confirmation-total">
              <strong>Total</strong>
              <strong>$53.39</strong>
            </div>

          </div>

          {/* Buttons */}
          <div className="confirmation-buttons">

            <button
              className="track-button"
              onClick={() => {
                alert("DoorDash tracking will be connected later.");
              }}
            >
              TRACK ON DOORDASH ↗
            </button>

            <button
              className="return-shop-button"
              onClick={() => router.push("/")}
            >
              RETURN TO SHOP
            </button>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="site-footer">

        <div className="footer-logo">
          LÄYRD

          <p>
            Espresso Shots & Cake-in-a-Can.
            <br />
            Made fresh. Kept simple.
          </p>
        </div>

        <div className="footer-column">

          <h3>SUPPORT</h3>

          <a href="#">Shipping</a>
          <a href="#">Request Refund</a>
          <a href="#">Contact Us</a>
          <a href="#">Wholesale</a>

        </div>

        <div className="footer-column">

          <h3>INFORMATION</h3>

          <a href="#">FAQ</a>
          <a href="#">About LÄYRD</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Community</a>

        </div>

        <div className="footer-column">

          <h3>OUR NEWSLETTER</h3>

          <p>
            Join our newsletter to receive
            <br />
            exclusive announcements and offers!
          </p>

          <input
            type="email"
            placeholder="Email Address"
          />

          <button>
            SUBSCRIBE
          </button>

        </div>

        <div className="footer-bottom">

          <span>
            ©2026 LÄYRD. ALL RIGHTS RESERVED.
          </span>

          <div className="footer-payment-icons">
            <span>VISA</span>
            <span>●●</span>
            <span>Pay</span>
            <span>PayPal</span>
            <span>G Pay</span>
          </div>

          <span className="social-icons">
            ♧ ◎
          </span>

        </div>

      </footer>

    </div>
  );
}