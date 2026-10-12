"use client";

import { useRouter } from "next/navigation";
import React, { useState, useMemo } from "react";
import { products } from "@/lib/data";
import { getSizes, getPrice } from "@/lib/dataSize";
import styles from "./calculation.module.css";
import Header from "../components/Header";




export default function OrderConfirmationPage() {
  const router = useRouter();

  return (
    <div className="confirmation-page">
      {/* Announcement Bar */}
      <div className="announcement-bar">
        NEW LIMITED EDITION FLAVORS OUT THIS WEEKEND! • LEARN MORE
      </div>

     <Header/>

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
      </main>
    </div>
  );
}