"use client";

import Filter from "./components/Filter";
import DailyTickets from "./components/DailyTickets";
import Sli from "./components/Sli";
import DateTable from "./components/DateTable";
import CategoryTable from "./components/CategoryTable";

export default function Page() {
  return (
    <main className="reports-page">
      <div className="mx-auto flex h-full max-w7xl flex-col gap-6">
        {/* Filter bar */}
        <Filter
          onFilterChange={(value) => console.log("filter changed:", value)}
          onClear={() => console.log("filter cleared")}
        />

        {/* Main two-column grid */}
        <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-3">
          {/* Left column: chart + date table */}
          <div className="flex flex-col gap-6 overflow-hidden lg:col-span-2">
            <DailyTickets />
            <DateTable />
          </div>

          {/* Right column: SLI stat cards + category table */}
          <div className="flex flex-col gap-6 overflow-hidden">
            <Sli />
            <CategoryTable />
          </div>
        </div>
      </div>
    </main>
  );
}