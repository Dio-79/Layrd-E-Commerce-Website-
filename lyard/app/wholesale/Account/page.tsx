<<<<<<< HEAD
'use client';

import { useState } from 'react';
import { NOTIFICATION_OPTIONS } from '@/lib/Account/profile';

export default function Page() {
    const [businessName, setBusinessName] = useState("Café Aroma Ltd.");
    const [contactPerson, setContactPerson] = useState("Sara Al-Harbi");
    const [email, setEmail] = useState("orders@cafearoma.ca");
    const [phone, setPhone] = useState("+1 (403) 555-0192");
    const [address, setAddress] = useState("1204 17 Ave SW, Calgary, AB");

    const [notifications, setNotifications] = useState(() =>
        Object.fromEntries(NOTIFICATION_OPTIONS.map((o) => [o.key, o.defaultOn]))
    );

    function toggleNotification(key: string) {
        setNotifications((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
    }

    function handleSave() {
        console.log({ businessName, contactPerson, email, phone, address, notifications });
    }

    return (
        <div>
            <h1>Account settings</h1>

            <div>
                <div>
                    <ul>
                        <li>Business profile</li>
                        <li>Delivery addresses</li>
                        <li>Payment method</li>
                        <li>Security</li>
                    </ul>
                </div>

                <div>
                    <div>
                        <div>
                            <h1>Business profile</h1>
                            <p>This info appears on invoices and deliveries</p>
                        </div>
                        <button onClick={handleSave}>Save changes</button>
                    </div>

                    <div>
                        <div>
                            <p>Business Name</p>
                            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                        </div>
                        <div>
                            <p>Contact person</p>
                            <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
                        </div>
                        <div>
                            <p>Business e-mail</p>
                            <input value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div>
                            <p>Phone</p>
                            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <div>
                            <p>Primary delivery address</p>
                            <input value={address} onChange={(e) => setAddress(e.target.value)} />
                        </div>

                        <div>
                            <p>Notifications</p>
                            {NOTIFICATION_OPTIONS.map((option) => (
                                <label key={option.key}>
                                    <input
                                        type="checkbox"
                                        checked={notifications[option.key]}
                                        onChange={() => toggleNotification(option.key)}
                                    />
                                    <span>{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
=======
"use client";

import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { PageHeading, Panel, buttonStyle } from "@/app/portal-ui/PortalUI";

export default function WholesaleAccount() {
  const { user } = useAuth();
  return <>
    <PageHeading title="Business account" subtitle="Your signed-in details and account preferences." />
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Account details"><dl className="space-y-4 text-sm">
        <div><dt className="text-zinc-500">Contact name</dt><dd className="mt-1 font-semibold">{user?.name || "Not provided"}</dd></div>
        <div><dt className="text-zinc-500">Email</dt><dd className="mt-1 font-semibold break-all">{user?.email || "Not available"}</dd></div>
        <div><dt className="text-zinc-500">Account type</dt><dd className="mt-1 font-semibold capitalize">{user?.role || "Unknown"}</dd></div>
      </dl><Link href="/Setting" className={`${buttonStyle} mt-5`}>Open existing account settings</Link></Panel>
      <Panel title="Wholesale business profile"><p className="text-sm text-zinc-600">Business name, delivery addresses, invoice preferences, and notification settings will be available here once the wholesale account API supports them.</p>
        <div className="mt-5 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500">No wholesale business profile connected yet.</div>
      </Panel>
    </div>
  </>;
}
>>>>>>> 80246dcef234d6de08a72a7d377df29479efed73
