// app/(private)/error-handler/404/page.tsx
'use client';

import React from 'react';
import NotFound from '@/shared/ui/NotFound'; // ✅ Default import, not named import

export default function NotFoundPage() {
    return (
        <NotFound 
            message="Oops! The page you're looking for doesn't exist or has been moved."
            // showHomeButton={true}
            // showDashboardButton={true}
        />
    );
}