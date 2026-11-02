"use client";

// How a bundle or event preorder is paid. These checkouts never take card numbers
// themselves: the customer pays at pickup, or by Interac e-Transfer when it's set up.
import { etransferEmail, enabled } from "@/lib/payments/config";

export type PreorderPayMethod = "in_store" | "etransfer";

export const PREORDER_METHODS: { id: PreorderPayMethod; label: string; pickupOnly: boolean; on: boolean }[] = [
  { id: "in_store", label: "Pay at pickup", pickupOnly: true, on: true },
  { id: "etransfer", label: "Interac e-Transfer", pickupOnly: false, on: enabled.etransfer },
];

/** The methods on offer for this order (pay at pickup isn't possible for deliveries). */
export function preorderMethods(delivery: boolean) {
  return PREORDER_METHODS.filter((m) => m.on && !(delivery && m.pickupOnly));
}

export default function PreorderPayment({
  method,
  onChange,
  delivery,
  amountNow,
  classes,
}: {
  method: PreorderPayMethod | null;
  onChange: (m: PreorderPayMethod) => void;
  delivery: boolean;
  /** What to send by e-Transfer now (the deposit for events, the total for bundles) */
  amountNow: string;
  classes: { option: string; active: string; note: string };
}) {
  const methods = preorderMethods(delivery);

  if (methods.length === 0) {
    return (
      <p className={classes.note} role="alert">
        Online payment isn&apos;t set up yet, so delivery orders can&apos;t be paid. Choose pickup to pay when you
        collect your order.
      </p>
    );
  }

  return (
    <div role="radiogroup" aria-label="Payment method">
      {methods.map((m) => (
        <button
          key={m.id}
          type="button"
          role="radio"
          aria-checked={method === m.id}
          className={`${classes.option} ${method === m.id ? classes.active : ""}`}
          onClick={() => onChange(m.id)}
        >
          <span>{m.label}</span>
        </button>
      ))}
      {method === "in_store" && (
        <p className={classes.note}>
          Pay by card or cash when you pick up your order. We&apos;ll save your order now and start preparing it.
        </p>
      )}
      {method === "etransfer" && (
        <p className={classes.note}>
          After you place the order, send an Interac e-Transfer of <strong>{amountNow}</strong> to{" "}
          <strong>{etransferEmail}</strong> with your order reference in the message.
        </p>
      )}
    </div>
  );
}

/** On the confirmation page: how and when to pay this preorder. */
export function PreorderPaymentNote({
  payment,
  reference,
  className,
}: {
  payment?: { status?: string; amountDueNow?: number; total?: number; etransferEmail?: string };
  reference: string;
  className?: string;
}) {
  if (!payment) return null;
  const money = (n = 0) => `$${n.toFixed(2)}`;
  return (
    <p className={className} role="note">
      {payment.status === "awaiting_etransfer" ? (
        <>
          <strong>Payment:</strong> send an Interac e-Transfer of <strong>{money(payment.amountDueNow)}</strong> to{" "}
          <strong>{payment.etransferEmail}</strong> with <strong>{reference}</strong> in the message. Any balance is paid
          at pickup.
        </>
      ) : payment.status === "paid" ? (
        <>
          <strong>Payment:</strong> received. Thank you!
        </>
      ) : (
        <>
          <strong>Payment:</strong> pay <strong>{money(payment.total)}</strong> by card or cash when you pick up your
          order. Bring your reference <strong>{reference}</strong>.
        </>
      )}
    </p>
  );
}
