"use client";

import { useRouter } from "next/navigation";


import React, { useState, useMemo } from "react";
import { products } from "@/lib/data";
import { getSizes, getPrice } from "@/lib/dataSize";
import styles from "./calculation.module.css";
import Header from "../components/Header";
import Footer from "../components/Footer";



export default function CheckoutPage() {
  const router = useRouter();

  const [deliveryMethod, setDeliveryMethod] = useState<"ship" | "pickup">(
    "ship"
  );

  const handleCompleteOrder = () => {
    router.push("/order-confirmation");
  };

  return (
    <>
<Header/>

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

            <button>APPLY</button>
          

          <button
            className="complete-order"
            onClick={handleCompleteOrder}
          >
            COMPLETE ORDER
          </button>

        </aside>

      </main>

      
      <Footer />
    </>
  );
}