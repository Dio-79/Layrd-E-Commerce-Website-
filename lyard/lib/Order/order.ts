export type Order = {
    orderID: string;
    quantity: string;
    date: string;
    status: "Processing" | "Out for delivery" | "Delivered" | "Pending Payment";
    total: number;
    type: "recurring" | "one-time";
};

export const orders: Order[] = [
    { orderID: "#ORD-123", quantity: "150 cans", date: "Today, 10:10 AM", status: "Processing", total: 486.00, type: "recurring" },
    { orderID: "#ORD-122", quantity: "80 cans", date: "Today, 9:09 AM", status: "Out for delivery", total: 259.20, type: "one-time" },
    { orderID: "#ORD-121", quantity: "150 cans", date: "Yesterday, 11:11 PM", status: "Delivered", total: 486.00, type: "recurring" },
    { orderID: "#ORD-121b", quantity: "120 cans", date: "2026/07/13, 5:55 AM", status: "Pending Payment", total: 388.80, type: "one-time" },
    { orderID: "#ORD-W-91", quantity: "120 cans", date: "2026/06/15, 12:12 PM", status: "Delivered", total: 324.00, type: "recurring" },
];