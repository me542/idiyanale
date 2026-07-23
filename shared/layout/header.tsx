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
import { logoutSuperAdmin } from "@/services/integration/auth/logout"; // adjust path to wherever logout.ts actually lives
import { useActivityPanel } from "./activity-panel-context";

interface Breadcrumb {
  href: string;
  label: string;
  isLast: boolean;
  isClickable: boolean;
}

const CLICKABLE_ROUTES = new Set([
  "/ticket/dashboard",
  "/ticket/all-tickets",
  "/ticket/reports",
  "/minor-task/dashboard",
  "/minor-task/all-tasks",
  "/minor-task/reports",
  "/chat",
  "/settings/profile",
  "/settings/top",
  "/settings/template",
  "/settings/user management",
  "/knowledge",

  //super-admin
  "/dashboard",
  "/management/institution",
  "/management/user"
]);

const NON_CLICKABLE_PARENTS = new Set([
  "/ticket",
  "/minor-task",
  "/settings",
  "/management"
]);

export default function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const isMounted = typeof document !== "undefined";
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { openPanel } = useActivityPanel();

  // Portals need `document`, which only exists on the client

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

  // Page configuration
  const pageConfig: Record<string, { title: string; icon?: React.ReactNode }> = {
    "/ticket/dashboard": { title: "Dashboard" },
    "/ticket/all-tickets": { title: "All Tickets" },
    "/ticket/reports": { title: "Reports" },
    "/minor-task/dashboard": { title: "Dashboard" },
    "/minor-task/all-tasks": { title: "All Tasks" },
    "/minor-task/reports": { title: "Reports" },
    "/settings/profile": { title: "Profile" },
    "/settings/top": { title: "Top" },
    "/settings/template": { title: "Template" },
    "/settings/user management": { title: "User Management" },
    "/chat": { title: "Chat" },
    "/knowledge": { title: "Knowledge" },

    //super-admin
    "/dashboard": { title: "Dashboard" },
    "/management/institution": { title: "Institution Management" },
    "/management/user": { title: "User Management" }
  };

  // Generate breadcrumbs from pathname with clickable logic
  const generateBreadcrumbs = (): Breadcrumb[] => {
    const paths = pathname.split("/").filter((path) => path !== "");

    const breadcrumbs: Breadcrumb[] = [
      {
        href: "/",
        label: "Home",
        isLast: paths.length === 0,
        isClickable: false // Home is always clickable
      }
    ];

    let currentPath = "";
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      let label = path.charAt(0).toUpperCase() + path.slice(1);

      // Custom labels for specific paths
      if (path === "Ticket") label = "Ticket";
      if (path === "Minor Task") label = "Minor Task";
      if (path === "Settings") label = "Settings";
      if (path === "Chat") label = "Chat";
      if (path === "Knowledge") label = "Knowledge";

      // Custom labels for super-admin paths
      if (path === "Super-Admin") label = "Super Admin";
      if (path === "Management") label = "Management";
      if (path === "Institution") label = "Institution";
      if (path === "User") label = "User";

      // Determine if this breadcrumb should be clickable
      const isClickable = CLICKABLE_ROUTES.has(currentPath) && !NON_CLICKABLE_PARENTS.has(currentPath);
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
  const currentPageConfig = pageConfig[pathname] || { title: breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard" };
  const pageTitle = currentPageConfig.title;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Opens the confirmation modal instead of logging out directly
  const handleLogoutClick = () => {
    setIsLogoutConfirmOpen(true);
  };

  // Called once the user confirms inside the modal
  const handleConfirmLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutSuperAdmin();
    } catch (error) {
      // Even if the API call fails, we still want to clear the user out
      // of the client since their session may already be invalid.
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
          {currentPageConfig.icon && (
            <span className="text-teal-600">{currentPageConfig.icon}</span>
          )}
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            {pageTitle}
          </h1>
        </div>

        {/* Breadcrumbs Navigation */}
        {breadcrumbs.length > 1 && (
          <nav className="flex items-center gap-1.5 text-sm mt-1" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.href}>
                {idx > 0 && <ChevronRight size={14} className="text-gray-300" />}
                {crumb.isLast ? (
                  <span className="text-[#1E4637]  font-medium text-xs">
                    {crumb.label}
                  </span>
                ) : crumb.isClickable ? (
                  <Link
                    href={crumb.href}
                    className="text-gray-500 hover:text-[#1E4637]  transition-colors text-xs"
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
        {/* Global Search (Optional) */}
        <form onSubmit={handleSearch} className="hidden lg:block">
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
        </form>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
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
              <p className="text-sm font-bold text-gray-900 leading-none">Super-Admin</p>
              <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">Admin</p>
            </div>
            <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
          </div>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="h-24 bg-linear-to-br from-[#D9E392] to-[#B5C94B]" />

              <div className="px-6 pb-6 -mt-10">
                <div className="w-20 h-20 bg-white rounded-full p-1 shadow-md mb-3">
                  <div className="w-full h-full bg-linear-to-br from-[#1E4637] to-[#2a6b4e] rounded-full flex items-center justify-center text-white">
                    <UserIcon size={32} />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900">Super-Admin</h3>
                <p className="text-sm text-gray-500">202501-123456</p>

                <div className="mt-6 space-y-4">
                  <div className="flex gap-3">
                    <UserIcon size={16} className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Role</p>
                      <p className="text-sm font-semibold text-gray-700">Cloud Management</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Lock size={16} className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Institution</p>
                      <p className="text-sm font-semibold text-gray-700">BAKAWAN Data Analytics, INC</p>
                    </div>
                  </div>
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

      {/* Logout Confirmation Modal (rendered via portal so the header's
          backdrop-blur filter doesn't hijack position:fixed centering) */}
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