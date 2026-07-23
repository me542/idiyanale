'use client';

import React, { useState } from 'react';
// import { LayoutDashboard } from 'lucide-react';
import Filter from './components/filter';
import UserChart from './components/user-chart';
import TicketChart from './components/ticket-chart';
import CountChart from './components/count-chart';
import DailyTicket from './components/daily-ticket';

export default function DashboardPage() {
  const [_filters, setFilters] = useState({
    institution: 'ALL',
    ticketType: 'ALL',
  });

  const handleFilterChange = (newFilters: { institution: string; ticketType: string }) => {
    setFilters(newFilters);
    console.log('Filters applied:', newFilters);
    // TODO: Fetch data based on filters
  };

  return (
    <div className="min-h-screen p-2">
      <div className="max-w-15xl mx-auto">

        {/* Filters */}
        <Filter onFilterChange={handleFilterChange} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* User Chart */}
          <UserChart />
          
          {/* Ticket Chart */}
          <div className="lg:col-span-1">
            <TicketChart />
          </div>

          {/* Count Chart */}
          <div className="lg:col-span-1">
            <CountChart />
          </div>
        </div>

        {/* Daily Ticket Chart - Full Width */}
        <div>
          <DailyTicket />
        </div>
      </div>
    </div>
  );
}
