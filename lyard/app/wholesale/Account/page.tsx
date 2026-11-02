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