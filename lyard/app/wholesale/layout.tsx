import React from 'react';
import { ReactNode } from 'react';


export default function wholesaleLayout({children}: {children: ReactNode}) {
    return (
        // admin container
        <div>
            <nav>navbar here</nav>
            {children}
        </div>
    );

}