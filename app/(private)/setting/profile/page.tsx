"use client";

import { useState } from "react";
import {
  ProfileSidebar,
  type NavKey,
  type ProfileUser,
} from "./components/profile-option";
import {
  InformationPanel,
  type WorkInfo,
  type UnitInfo,
} from "./components/information";

const user: ProfileUser = {
  name: "",
  company: "",
};

const workInfo: WorkInfo = {
  staffId: "",
  firstName: "",
  lastName: "",
  contactNumber: "",
  email: "",
  institution: "",
  position: "",
  role: "",
};

const unitInfo: UnitInfo = {
  laptop: "",
  serialNumber: "",
  macAddress: "",
  ipAddress: "",
};

const kpi = {
  staffId: "",
  firstName: "",
};

export default function Page() {
  const [activeNav, setActiveNav] = useState<NavKey>("work");
  const [themeOn, setThemeOn] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50">
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