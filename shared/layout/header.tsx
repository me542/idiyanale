"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown, LogOut, Lock, User as UserIcon,
  ChevronRight, Bell, Search, AlertTriangle, X,
  Ticket
} from "lucide-react";
import { logoutUser, logoutSuperAdmin } from "@/services/integration/auth/logout";
import { useActivityPanel } from "./activity-panel-context";
import { ROUTES, NON_CLICKABLE_PARENTS, getRoute } from "@/lib/auth/routes";
import { getCurrentUser, type CurrentUser } from "./Activity/api/current_user";

interface Breadcrumb {
  href: string;
  label: string;
  isLast: boolean;
  isClickable: boolean;
}

export default function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const isMounted = typeof document !== "undefined";
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { openPanel } = useActivityPanel();

  // Fetch the live, full user record (not just what's cached from login)
  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch((err) => {
        console.error("Failed to load current user:", err);
      });
  }, []);

  const isSuperAdmin = currentUser?.kind === "super-admin";
  const isStaff = currentUser?.kind === "staff";

  const displayName = isSuperAdmin
    ? currentUser?.data.username ?? "Super-Admin"
    : isStaff && currentUser
      ? `${currentUser.data.first_name} ${currentUser.data.last_name}`.trim()
      : "User";

  const displayRole = isStaff && currentUser?.data.role ? currentUser.data.role.role_name : "";

  // institution is a nested object on the User type: { institution_id, institution_code, institution_name }
  const displayInstitution = isStaff && currentUser
    ? currentUser.data.institution?.institution_name ?? ""
    : "";

  const displayStaffId = isStaff && currentUser ? currentUser.data.staff_id ?? "" : "";
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll while the logout confirmation modal is open
  useEffect(() => {
    if (isLogoutConfirmOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLogoutConfirmOpen]);

  // Close confirmation modal on Escape
  useEffect(() => {
    if (!isLogoutConfirmOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoggingOut) {
        setIsLogoutConfirmOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isLogoutConfirmOpen, isLoggingOut]);

  // Generate breadcrumbs from pathname with clickable logic
  const generateBreadcrumbs = (): Breadcrumb[] => {
    const paths = pathname.split("/").filter((path) => path !== "");

    const breadcrumbs: Breadcrumb[] = [
  {
    href: "/ticket/dashboard",
    label: isStaff && displayInstitution ? displayInstitution : "Home",
    isLast: paths.length === 0,
    isClickable: true,
  }
];

    let currentPath = "";
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      let label = path.charAt(0).toUpperCase() + path.slice(1);

      if (path === "Ticket") label = "Ticket";
      if (path === "Minor Task") label = "Minor Task";
      if (path === "management") label = "management";
      if (path === "Chat") label = "Chat";
      if (path === "Knowledge") label = "Knowledge";

      if (path === "Super-Admin") label = "Super Admin";
      if (path === "Management") label = "Management";
      if (path === "Institution") label = "Institution";
      if (path === "User") label = "User";

      const isClickable = ROUTES.some((r) => r.path === currentPath && r.clickable)
        && !NON_CLICKABLE_PARENTS.has(currentPath);
      const isLast = index === paths.length - 1;

      breadcrumbs.push({
        href: currentPath,
        label,
        isLast,
        isClickable,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  const currentPageConfig = getRoute(pathname) ?? { title: breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard" };
  const pageTitle = currentPageConfig.title;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogoutClick = () => {
    setIsLogoutConfirmOpen(true);
  };

  // Routes to the correct logout endpoint based on the fetched role,
  // instead of always hitting the super-admin logout route.
  const handleConfirmLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      if (isSuperAdmin) {
        await logoutSuperAdmin();
      } else {
        await logoutUser();
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      setIsLoggingOut(false);
      setIsLogoutConfirmOpen(false);
      setIsProfileOpen(false);
      router.push("/login");
    }
  };

  return (
    <header className="h-20 px-8 flex items-center justify-between sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      {/* Left Section - Title & Breadcrumbs */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            {pageTitle}
          </h1>
        </div>

        {breadcrumbs.length > 1 && (
          <nav className="flex items-center gap-1.5 text-sm mt-1" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, idx) => (
  <React.Fragment key={`${crumb.href}-${idx}`}>
    {idx > 0 && (
      <ChevronRight size={14} className="text-gray-300" />
    )}

    {crumb.isLast ? (
      <span className="text-[#1E4637] font-medium text-xs">
        {crumb.label}
      </span>
    ) : crumb.isClickable ? (
      <Link
        href={crumb.href}
        className="text-gray-500 hover:text-[#1E4637] transition-colors text-xs"
      >
        {crumb.label}
      </Link>
    ) : (
      <span className="text-gray-400 text-xs cursor-default">
        {crumb.label}
      </span>
    )}
  </React.Fragment>
))}
          </nav>
        )}
      </div>

      {/* Right Section - Search & Profile */}
      <div className="flex items-center gap-4">
        {/* <form onSubmit={handleSearch} className="hidden lg:block">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all"
            />
          </div>
        </form> */}

        <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {!isSuperAdmin && (
          <div>
            <button
              onClick={() => openPanel()}
              className="group relative flex items-center gap-3 px-3.5 py-2.5 bg-white/80 hover:bg-[#1E4637] rounded-xl transition-colors"
            >
              <Ticket
                size={20}
                className="text-[#1E4637] transition-colors group-hover:text-white"
              />
              <span className="text-[12px] uppercase font-semibold text-[#1E4637] transition-colors group-hover:text-white">
                + Ticket
              </span>
            </button>
          </div>
        )}

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-100 rounded-xl transition-all"
          >
            <div className="w-10 h-10 bg-linear-to-br from-[#1E4637] to-[#2a6b4e] rounded-full flex items-center justify-center text-white shadow-md">
              <UserIcon size={20} />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-bold text-gray-900 leading-none">{displayName}</p>
              <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">{isSuperAdmin ? "Admin" : displayRole}</p>
            </div>
            <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
          </div>

          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="h-24 bg-linear-to-br from-[#D9E392] to-[#B5C94B]" />

              <div className="px-6 pb-6 -mt-10">
                <div className="w-20 h-20 bg-white rounded-full p-1 shadow-md mb-3">
                  <div className="w-full h-full bg-linear-to-br from-[#1E4637] to-[#2a6b4e] rounded-full flex items-center justify-center text-white">
                    <UserIcon size={32} />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900">{displayName}</h3>
                {displayStaffId && <p className="text-sm text-gray-500">{displayStaffId}</p>}

                <div className="mt-6 space-y-4">
                  <div className="flex gap-3">
                    <UserIcon size={16} className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Role</p>
                      <p className="text-sm font-semibold text-gray-700">{isSuperAdmin ? "Cloud Management" : displayRole || "—"}</p>
                    </div>
                  </div>

                  {!isSuperAdmin && (
                    <div className="flex gap-3">
                      <Lock size={16} className="text-gray-400 mt-1" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Institution</p>
                        <p className="text-sm font-semibold text-gray-700">{displayInstitution || "—"}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 space-y-3">
                  <button
                    onClick={handleLogoutClick}
                    disabled={isLoggingOut}
                    className="w-full py-3 bg-[#1E4637] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#163529] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <LogOut size={16} /> {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {isMounted && isLogoutConfirmOpen && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isLoggingOut) {
              setIsLogoutConfirmOpen(false);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            aria-describedby="logout-confirm-desc"
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between p-6 pb-0">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle size={22} className="text-red-500" />
              </div>
              <button
                onClick={() => !isLoggingOut && setIsLogoutConfirmOpen(false)}
                disabled={isLoggingOut}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pt-4 pb-6">
              <h3 id="logout-confirm-title" className="text-lg font-bold text-gray-900">
                Log out of your account?
              </h3>
              <p id="logout-confirm-desc" className="text-sm text-gray-500 mt-2">
                You&apos;ll need to sign in again to access the dashboard.
              </p>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setIsLogoutConfirmOpen(false)}
                disabled={isLoggingOut}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
                className="flex-1 py-3 bg-[#1E4637] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#163529] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <LogOut size={16} /> {isLoggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}