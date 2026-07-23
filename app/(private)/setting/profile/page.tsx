"use client";

import { useState } from "react";
import { ProfileSidebar, type NavKey, type ProfileUser } from "./components/profile-option";
import { InformationPanel, type WorkInfo, type UnitInfo } from "./components/information";

const user: ProfileUser = {
  name: "Reyvin Flor",
  company: "Bakawan Data Analytics, INC.",
};

const workInfo: WorkInfo = {
  staffId: "202512-57725",
  firstName: "Reyvin",
  lastName: "Flor",
  contactNumber: "09512512512",
  email: "reyvin.flor@cardmri.com",
  institution: "BAKAWAN Data Analytics, INC.",
  position: "Cloud Operation Support",
  role: "Resolver",
};

const unitInfo: UnitInfo = {
  laptop: "Macbook Air M4",
  serialNumber: "JHDWBFI33",
  macAddress: "12:51:75:41",
  ipAddress: "10.27.1.164",
};

const kpi = {
  staffId: "202512-57725",
  firstName: "Reyvin",
};

export default function Page() {
  const [activeNav, setActiveNav] = useState<NavKey>("work");
  const [themeOn, setThemeOn] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 ">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <ProfileSidebar
          user={user}
          activeNav={activeNav}
          onSelectNav={setActiveNav}
          themeOn={themeOn}
          onToggleTheme={setThemeOn}
        />
        <InformationPanel
          activeNav={activeNav}
          workInfo={workInfo}
          unitInfo={unitInfo}
          kpi={kpi}
        />
      </div>
    </div>
  );
}