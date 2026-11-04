import React from 'react';
import { ReactNode } from 'react';
import { RequireRole } from '@/app/components/RequiredRoles';


// Only admins can open /admin pages: signed-out visitors go to the login page,
// other signed-in users go back to their own home page.
export default function adminLayout({children}: {children: ReactNode}) {
    return (
        <RequireRole permission="admin:portal">
            {/* admin container */}
            <div>
                <nav>navbar here</nav>
                {children}
            </div>
        </RequireRole>
    );

}
