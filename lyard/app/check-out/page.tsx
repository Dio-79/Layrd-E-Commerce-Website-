"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CheckoutPage() {
  const router = useRouter();

  const [deliveryMethod, setDeliveryMethod] = useState<"ship" | "pickup">(
    "ship"
  );

  const handleCompleteOrder = () => {
    router.push("/order-confirmation");
  };

  return (
    <div className="checkout-page">

      {/* Announcement */}
      <div className="announcement-bar">
        NEW LIMITED EDITION FLAVORS OUT THIS WEEKEND! • LEARN MORE
      </div>

      {/* Header */}
      <header className="site-header">

        <div className="header-top">
          <button className="menu-button" aria-label="Menu">
            ☰
          </button>

          <div className="site-logo">LÄYRD</div>

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

      {/* Main Content */}
      <main className="checkout-container">

        <div className="checkout-left">

          {/* Return to cart */}
          <button
            className="return-cart"
            onClick={() => router.push("/")}
          >
            ← Return to Cart
          </button>

          {/* Customer Information */}
          <section>
            <h2>Customer Information</h2>

            <div className="two-column">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="john.doe@gmail.com"
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (123) 456-7890"
                />
              </div>
            </div>
          </section>

          {/* Delivery Method */}
          <section>
            <h2>Delivery Method</h2>

            <div className="delivery-options">

              <button
                className={`delivery-option ${
                  deliveryMethod === "ship" ? "selected" : ""
                }`}
                onClick={() => setDeliveryMethod("ship")}
              >
                <div className="delivery-icon">📍</div>
                <strong>Ship to Address</strong>
                <span>POWERED BY DoorDash</span>
              </button>

              <button
                className={`delivery-option ${
                  deliveryMethod === "pickup" ? "selected" : ""
                }`}
                onClick={() => setDeliveryMethod("pickup")}
              >
                <div className="delivery-icon">▣</div>
                <strong>Pickup</strong>
                <span>Pickup at 123 St. NE</span>
              </button>

            </div>
          </section>

          {/* Delivery Information */}
          <section>
            <h2>Delivery Information</h2>

            <div className="form-group full">
              <label>Full Name</label>
              <input type="text" placeholder="John Doe" />
            </div>

            <div className="form-group full">
              <label>Street Address</label>
              <input
                type="text"
                placeholder="456, Example Ave, SE"
              />
            </div>

            <div className="three-column">

              <div className="form-group">
                <label>City</label>
                <input type="text" placeholder="Calgary" />
              </div>

              <div className="form-group">
                <label>Province</label>
                <input type="text" placeholder="AB" />
              </div>

              <div className="form-group">
                <label>ZIP Code</label>
                <input type="text" placeholder="EX1 123" />
              </div>

            </div>
          </section>

          {/* Payment */}
          <section>
            <h2>Payment Details</h2>

            <div className="payment-card">

              <div className="payment-title">
                💳 Credit / Debit Card
              </div>

              <div className="card-inputs">

                <div className="form-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                  />
                </div>

                <div className="form-group">
                  <label>Expiration</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                  />
                </div>

                <div className="form-group">
                  <label>Security Code</label>
                  <input
                    type="text"
                    placeholder="CVC"
                  />
                </div>

              </div>

              <div className="payment-logos">
                <span>VISA</span>
                <span>●●</span>
              </div>

            </div>

            <button className="alternative-payment">
              Apple Pay
              <span>Pay</span>
            </button>

            <button className="alternative-payment">
              Google Pay
              <span>G Pay</span>
            </button>

            <button className="alternative-payment">
              PayPal
              <span>PayPal</span>
            </button>

          </section>

        </div>

        {/* Order Summary */}
        <aside className="order-summary">

          <h2>Order Summary</h2>

          <div className="order-item">

            <div className="item-image fruit-image">
              🥗
            </div>

            <div className="item-info">
              <strong>Fruit Salad</strong>
              <small>Standard Size ×6</small>
            </div>

            <strong>$44.00</strong>

          </div>

          <div className="order-item">

            <div className="item-image coffee-image">
              ☕
            </div>

            <div className="item-info">
              <strong>Double Espresso</strong>
              <small>Sweetness: Sugar ×1</small>
            </div>

            <strong>$4.00</strong>

          </div>

          <div className="summary-line">
            <span>Subtotal</span>
            <span>$48.00</span>
          </div>

          <div className="summary-line">
            <span>Shipping</span>
            <span>$1.99</span>
          </div>

          <div className="summary-line">
            <span>Estimated Tax</span>
            <span>$2.40</span>
          </div>

          <div className="summary-total">
            <strong>Total</strong>
            <strong>$53.39</strong>
          </div>

          <div className="promo-row">
            <input
              type="text"
              placeholder="Promo Code"
            />
            <button>APPLY</button>
          </div>

          <button
            className="complete-order"
            onClick={handleCompleteOrder}
          >
            COMPLETE ORDER
          </button>

        </aside>

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
            exclusive announcements and offers!
          </p>

          <input
            type="email"
            placeholder="Email Address"
          />

          <button>SUBSCRIBE</button>
        </div>

        <div className="footer-bottom">
          ©2026 LÄYRD. ALL RIGHTS RESERVED.
        </div>

      </footer>

    </div>
  );
}