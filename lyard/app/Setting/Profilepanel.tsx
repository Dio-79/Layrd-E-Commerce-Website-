"use client";

import { useId, useState, type FormEvent } from "react";
import {
  NOTIFICATION_OPTIONS,
  validateProfile,
  type CustomerProfile,
  type NotificationKey,
  type ProfileErrors,
} from "@/lib/Account/profile";
import { Field } from "./Field";
import styles from "./account.module.css";

type Draft = Pick<CustomerProfile, "name" | "email" | "phone" | "address" | "notifications">;

const pick = (p: CustomerProfile): Draft => ({
  name: p.name,
  email: p.email,
  phone: p.phone,
  address: { ...p.address },
  notifications: { ...p.notifications },
});

export default function ProfilePanel({
  profile,
  onSave,
}: {
  profile: CustomerProfile;
  onSave: (next: CustomerProfile) => Promise<void>;
}) {
  const uid = useId();
  const id = (field: string) => `${uid}-${field}`;

  const [draft, setDraft] = useState<Draft>(() => pick(profile));
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(pick(profile));

  const update = (changes: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...changes }));
    setMessage(null);
  };
  const updateAddress = (field: keyof Draft["address"], value: string) =>
    update({ address: { ...draft.address, [field]: value } });
  const toggle = (key: NotificationKey, checked: boolean) =>
    update({ notifications: { ...draft.notifications, [key]: checked } });

  const invalid = (field: keyof ProfileErrors) => ({
    "aria-invalid": !!errors[field],
    "aria-describedby": errors[field] ? `${id(field)}-error` : undefined,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Merge into the latest saved profile, so payment methods are never overwritten
    const next: CustomerProfile = {
      ...profile,
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      address: {
        street: draft.address.street.trim(),
        city: draft.address.city.trim(),
        province: draft.address.province.trim(),
        postal: draft.address.postal.trim(),
      },
      notifications: draft.notifications,
    };

    const found = validateProfile(next);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setMessage({ type: "error", text: "Please fix the highlighted fields." });
      return;
    }

    setSaving(true);
    try {
      await onSave(next);
      setDraft(pick(next));
      setMessage({ type: "ok", text: "Your changes were saved." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "We couldn't save your changes.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.panel} onSubmit={handleSubmit} noValidate aria-labelledby={id("title")}>
      <div className={styles.panelHead}>
        <div>
          <h2 id={id("title")} className={styles.panelTitle}>
            User Profile
          </h2>
          <p className={styles.panelSub}>This info appears on invoices and deliveries</p>
        </div>
        <button type="submit" className={styles.save} disabled={!dirty || saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {message && (
        <p className={message.type === "ok" ? styles.success : styles.error} role="status">
          {message.text}
        </p>
      )}

      <Field label="Name" htmlFor={id("name")} error={errors.name}>
        <input
          id={id("name")}
          type="text"
          autoComplete="name"
          placeholder="Full name"
          value={draft.name}
          onChange={(e) => update({ name: e.target.value })}
          {...invalid("name")}
        />
      </Field>

      <div className={styles.row}>
        <Field label="Personal e-mail" htmlFor={id("email")} error={errors.email}>
          <input
            id={id("email")}
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={draft.email}
            onChange={(e) => update({ email: e.target.value })}
            {...invalid("email")}
          />
        </Field>

        <Field label="Phone" htmlFor={id("phone")} error={errors.phone}>
          <input
            id={id("phone")}
            type="tel"
            autoComplete="tel"
            placeholder="Phone number"
            value={draft.phone}
            onChange={(e) => update({ phone: e.target.value })}
            {...invalid("phone")}
          />
        </Field>
      </div>

      <Field label="Primary delivery address" htmlFor={id("street")} error={errors.street}>
        <input
          id={id("street")}
          type="text"
          autoComplete="street-address"
          placeholder="Street address"
          value={draft.address.street}
          onChange={(e) => updateAddress("street", e.target.value)}
          {...invalid("street")}
        />
      </Field>

      <div className={styles.row3}>
        <Field label="City" htmlFor={id("city")} error={errors.city}>
          <input
            id={id("city")}
            type="text"
            autoComplete="address-level2"
            value={draft.address.city}
            onChange={(e) => updateAddress("city", e.target.value)}
            {...invalid("city")}
          />
        </Field>
        <Field label="Province" htmlFor={id("province")} error={errors.province}>
          <input
            id={id("province")}
            type="text"
            autoComplete="address-level1"
            value={draft.address.province}
            onChange={(e) => updateAddress("province", e.target.value)}
            {...invalid("province")}
          />
        </Field>
        <Field label="Postal code" htmlFor={id("postal")} error={errors.postal}>
          <input
            id={id("postal")}
            type="text"
            autoComplete="postal-code"
            value={draft.address.postal}
            onChange={(e) => updateAddress("postal", e.target.value)}
            {...invalid("postal")}
          />
        </Field>
      </div>

      <fieldset className={styles.notifications}>
        <legend>Notifications</legend>
        {NOTIFICATION_OPTIONS.map((option) => (
          <label key={option.key} className={styles.toggleRow}>
            <span>{option.label}</span>
            <input
              type="checkbox"
              role="switch"
              className={styles.switch}
              checked={draft.notifications[option.key]}
              onChange={(e) => toggle(option.key, e.target.checked)}
            />
          </label>
        ))}
      </fieldset>
    </form>
  );
}