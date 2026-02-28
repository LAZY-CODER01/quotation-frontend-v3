'use client';

import React from 'react';
import EmployeeAnalytics from '../../components/dashboard/EmployeeAnalytics';

export default function AnalyticsPage() {
    return (
        <div className="h-full w-full bg-[hsl(var(--bg))] overflow-y-auto">
            <EmployeeAnalytics />
        </div>
    );
}
