"use client";

import StatusTickets from "./components/StatusTickets";
import MyTicket from "./components/MyTicket";
import ByCategory from "./components/ByCategory";
import DueActivity from "./components/DueActivity";

export default function DashboardPage() {
  // Pass real data into each component below to populate the dashboard.
  // Leaving props out (or empty arrays) renders the no-data / empty states.

  return (
    <main className="status-tickets">

      <StatusTickets />

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1.1fr] gap-5 items-start">
        <MyTicket tickets={[]} />

        <div className="flex flex-col gap-5">
          <DueActivity />
          <ByCategory categories={[]} />
        </div>
      </div>
    </main>
  );
}
