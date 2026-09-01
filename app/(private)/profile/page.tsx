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


const kpi = {
  staffId: "",
  firstName: "",
};

export default function Page() {
  const [activeNav, setActiveNav] = useState<NavKey>("work");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex flex-col gap-6">
        <ProfileSidebar
          activeNav={activeNav}
          onSelectNav={setActiveNav}
        />

        <InformationPanel
          activeNav={activeNav}
          kpi={kpi}
        />
      </div>
    </div>
  );
}