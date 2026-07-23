"use client";

import { Info, SlidersHorizontal } from "lucide-react";

export type NavKey = "work" | "kpi";

export type ProfileUser = {
  name: string;
  company: string;
  /** Single character shown in the avatar circle. Falls back to the first
   * letter of `name` if not provided. */
  initial?: string;
};

export function ProfileSidebar({
  user,
  activeNav,
  onSelectNav,
  themeOn,
  onToggleTheme,
}: {
  user: ProfileUser;
  activeNav: NavKey;
  onSelectNav: (nav: NavKey) => void;
  themeOn: boolean;
  onToggleTheme: (next: boolean) => void;
}) {
  const initial = (user.initial ?? user.name.charAt(0)).toUpperCase();

  return (
    <div className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Identity */}
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-xl font-semibold text-white">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-800">
            {user.name}
          </p>
          <p className="truncate text-xs font-medium text-slate-400">
            {user.company}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-6 space-y-2">
        <NavButton
          label="Work Information"
          icon={<Info size={16} />}
          active={activeNav === "work"}
          onClick={() => onSelectNav("work")}
        />
        <NavButton
          label="Key Performance Indicator"
          icon={<SlidersHorizontal size={16} />}
          active={activeNav === "kpi"}
          onClick={() => onSelectNav("kpi")}
        />
      </nav>

      {/* Theme toggle */}
      <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
        <span className="text-sm font-medium text-slate-500">
          Theme Mode:
        </span>
        <ThemeSwitch checked={themeOn} onChange={onToggleTheme} />
      </div>
    </div>
  );
}

function NavButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-emerald-800 text-white"
          : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
      }`}
    >
      <span className={active ? "text-white" : "text-slate-400"}>{icon}</span>
      {label}
    </button>
  );
}

function ThemeSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
        checked ? "bg-emerald-600" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}