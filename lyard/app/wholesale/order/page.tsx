import React from 'react';
import { orders } from '@/lib/Order/order';

export default function OrdersPage() {
    return (
        <div>
            <h1>Order history</h1>

            {/* Tabs */}
            <div>
                <p>All</p>
                <p>Recurring</p>
                <p>One-time</p>
            </div>

            {/* Stats cards */}
            <div>
                <div>
                    <p>REVENUE</p>
                    <p>$1,195.00</p>
                </div>
                <div>
                    <p>TOTAL ORDERS</p>
                    <p>123</p>
                </div>
                <div>
                    <p>NEW CUSTOMERS</p>
                    <p>78</p>
                </div>
                <div>
                    <p>ACTIVE WHOLESALE</p>
                    <p>11</p>
                </div>
            </div>

            {/* Table */}
            <table>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Quantity</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.orderID}>
                            <td>{order.orderID}</td>
                            <td>{order.quantity}</td>
                            <td>{order.date}</td>
                            <td>{order.status}</td>
                            <td>${order.total.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}