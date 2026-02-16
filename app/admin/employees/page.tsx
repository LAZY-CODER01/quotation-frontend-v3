'use client';

import React from 'react';
import EmployeeDashboard from '../../components/dashboard/EmployeeDashboard';

export default function EmployeesPage() {
    return (
        <div className="h-full w-full bg-zinc-950 overflow-y-auto">
            <EmployeeDashboard />
        </div>
    );
}
