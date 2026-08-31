"use client";

export type NavKey = "work" | "kpi";

export function ProfileSidebar({
  activeNav,
  onSelectNav,
}: {
  activeNav: NavKey;
  onSelectNav: (nav: NavKey) => void;
}) {
  return (
    <div className="flex w-full justify-center sm:justify-start">
      <NavToggle activeNav={activeNav} onSelectNav={onSelectNav} />
    </div>
  );
}

function NavToggle({
  activeNav,
  onSelectNav,
}: {
  activeNav: NavKey;
  onSelectNav: (nav: NavKey) => void;
}) {
  return (
    <div className="flex w-full max-w-xs shrink-0 rounded-full bg-slate-200 sm:w-auto">
      <NavButton
        label="Info"
        active={activeNav === "work"}
        onClick={() => onSelectNav("work")}
      />

      <NavButton
        label="KPI"
        active={activeNav === "kpi"}
        onClick={() => onSelectNav("kpi")}
      />
    </div>
  );
}

function NavButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full px-6 py-2.5 text-sm font-bold uppercase tracking-wide transition-colors ${
        active
          ? "bg-emerald-400 text-white shadow-sm"
          : "text-slate-400 hover:text-slate-500"
      }`}
    >
      {label}
    </button>
  );
}