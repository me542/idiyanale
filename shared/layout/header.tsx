// shared/layout/Header.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronDown, LogOut, Lock, User as UserIcon, 
  ChevronRight, Settings, Bell, Search 
} from "lucide-react";

interface Breadcrumb {
  href: string;
  label: string;
  isLast: boolean;
  isClickable: boolean; 
}

// Define which routes are actual pages (leaf nodes)
const CLICKABLE_ROUTES = new Set([
  "/ticket/dashboard",
  "/ticket/all-tickets",
  "/ticket/reports",
  "/minor-task/dashboard",
  "/minor-task/all-task",
  "/minor-task/reports",
  "/chat",
  "/setting/user",
  "/setting/top",
  "/setting/template",
  "/knowledge",

  //super-admin
  "/dashboard",
  "/management/institution",
  "/management/user"
]);

// Define parent routes that should NOT be clickable
const NON_CLICKABLE_PARENTS = new Set([
  "/ticket",
  "/minor-task",
  "/setting",
  "/management"
]);

export default function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

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

  // Page configuration
  const pageConfig: Record<string, { title: string; icon?: React.ReactNode }> = {
    "/ticket/dashboard": { title: "Dashboard" },
    "/ticket/all-tickets": { title: "All Tickets" },
    "/ticket/reports": { title: "Reports" },
    "/minor-task/dashboard": { title: "Dashboard" },
    "/minor-task/all-task": { title: "All Tasksll" },
    "/minor-task/reports": { title: "Reports" },
    "/setting/user": { title: "User" },
    "/setting/top": { title: "Top" },
    "/setting/template": { title: "Template" },
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
      if (path === "Setting") label = "Setting";
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
                  
                  <div className="flex items-center gap-2 bg-green-50 rounded-xl p-3">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-semibold text-green-700">UA Testing</span>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <button className="w-full py-3 border border-[#05582E] text-[#05582E] rounded-xl text-sm font-bold hover:bg-green-50 transition-colors flex items-center justify-center gap-2">
                    <Settings size={16} /> Change Password
                  </button>
                  <button className="w-full py-3 bg-[#1E4637] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#163529] transition-colors">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}