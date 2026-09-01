'use client';

import React, { useState } from 'react';
import Filter from './components/filter';
import UserChart from './components/user-chart';
import TicketChart from './components/ticket-chart';
import CountChart from './components/count-chart';
import DailyTicket from './components/daily-ticket';

export interface DashboardFilters {
  institution: string;
  ticketType: string;
}

export default function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>({
    institution: 'ALL',
    ticketType: 'ALL',
  });

  const handleFilterChange = (newFilters: DashboardFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen p-2">
      <div className="max-w-15xl mx-auto">

        {/* Filters */}
        <Filter onFilterChange={handleFilterChange} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* User Chart - spans 2 columns */}
          <div className="lg:col-span-2">
            <UserChart filters={filters} />
          </div>

          {/* Count Chart - spans 1 column */}
          <div className="lg:col-span-1">
            <CountChart filters={filters} />
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Ticket Chart - spans 2 columns */}
          <div className="lg:col-span-2">
            <TicketChart filters={filters} />
          </div>

          {/* Daily Ticket - spans 1 column */}
          <div className="lg:col-span-1">
            <DailyTicket filters={filters} />
          </div>
        </div>
      </div>
    </div>
  );
}
