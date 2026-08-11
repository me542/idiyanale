"use client";

import { useState } from "react";
import {
  ProfileSidebar,
  type NavKey,
} from "./components/profile-option";
import {
  InformationPanel,
  type WorkInfo,
} from "./components/information";

const workInfo: WorkInfo = {
  staffId: "",
  firstName: "",
  lastName: "",
  email: "",
  institution: "",
  position: "",
  role: "",
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
          activeNav={activeNav}
          onSelectNav={setActiveNav}
          themeOn={themeOn}
          onToggleTheme={setThemeOn}
        />
        <InformationPanel
          activeNav={activeNav}
          workInfo={workInfo}
          kpi={kpi}
        />
      </div>
    </div>
  );
}