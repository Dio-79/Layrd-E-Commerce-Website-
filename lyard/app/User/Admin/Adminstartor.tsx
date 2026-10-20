"use client";

import { useAuth } from "@/app/context/AuthContext";
import type { RoleDefinition } from "@/lib/Auth/Permission";

// Admins run the business side: their own portal, stock, all orders, user roles.
export const ADMIN_ROLE: RoleDefinition = {
  role: "admin",
  label: "Administrator",
  home: "/admin",
  permissions: [
    "store:view",
    "admin:portal",
    "stock:view",
    "stock:edit",
    "orders:viewAll",
    "users:manage",
    "wholesale:pricing",
    "account:manage",
  ],
};

export interface StockRow {
  productId: number;
  name: string;
  quantity: number;
}

/**
 * Page body for /admin. Wrap the route in <RequireRole permission="admin:portal">.
 * Pass stock rows loaded from your own API (this component does not fetch them).
 */
export function AdminPortal({
  stock = [],
  onChangeQuantity,
}: {
  stock?: StockRow[];
  onChangeQuantity?: (productId: number, quantity: number) => void;
}) {
  const { can } = useAuth();

  return (
    <section aria-labelledby="admin-title">
      <h1 id="admin-title">Admin portal</h1>

      {can("stock:view") && (
        <div>
          <h2>Stock</h2>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>In stock</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((row) => (
                <tr key={row.productId}>
                  <td>{row.name}</td>
                  <td>
                    {can("stock:edit") && onChangeQuantity ? (
                      <input
                        type="number"
                        min={0}
                        defaultValue={row.quantity}
                        aria-label={`Stock for ${row.name}`}
                        onBlur={(e) =>
                          onChangeQuantity(row.productId, Math.max(0, Number(e.target.value) || 0))
                        }
                      />
                    ) : (
                      row.quantity
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {can("orders:viewAll") && <h2>All orders</h2>}
      {can("users:manage") && <h2>Users and roles</h2>}
    </section>
  );
}