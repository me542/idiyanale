"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown, LogOut, Lock, User as UserIcon,
  ChevronRight, Bell, Search, AlertTriangle, X,
  Ticket, MessageSquare, Clock, Trash2
} from "lucide-react";
import { logoutUser, logoutSuperAdmin } from "@/services/integration/auth/logout";
import { useActivityPanel } from "./activity-panel-context";
import { ROUTES, NON_CLICKABLE_PARENTS, getRoute } from "@/lib/auth/routes";
import { getCurrentUser, type CurrentUser } from "./Activity/api/current_user";
import { getAllTicketsByInstitution, InstitutionTicket } from "@/services/integration/ticket/get_all_ticket_by_insti";
import { ApiWrapper } from "@/services/api/ApiWrapper";
import TicketDetailPanel from "@/shared/layout/ticket_progress";

interface Notification {
  id: string;
  type: "ticket" | "chat";
  title: string;
  subtitle: string;
  ticketId?: string;
  conversationId?: number;
  timestamp: string;
  status?: string;
  unreadCount?: number;
}

interface Breadcrumb {
  href: string;
  label: string;
  isLast: boolean;
  isClickable: boolean;
}

// ---------- localStorage helpers for dismissed notifications ----------

const DISMISSED_KEY = "dismissed_notifications";

function loadDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDismissed(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
  } catch { /* ignore */ }
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

  // --- Notification state ---
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => loadDismissed());
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Raw tickets keyed by ticket_id — used to open TicketDetailPanel
  const [rawTicketsMap, setRawTicketsMap] = useState<Map<string, InstitutionTicket>>(new Map());

  // Ticket detail panel state
  const [selectedTicket, setSelectedTicket] = useState<InstitutionTicket | null>(null);
  const [isTicketPanelOpen, setIsTicketPanelOpen] = useState(false);

  // Persist dismissed IDs to localStorage
  useEffect(() => {
    saveDismissed(dismissedIds);
  }, [dismissedIds]);

  const dismissNotification = useCallback((id: string) => {
    setDismissedIds((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, []);

  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    const notifs: Notification[] = [];
    const ticketMap = new Map<string, InstitutionTicket>();

    try {
      const storedInstitutionId = localStorage.getItem("institution_id");
      if (storedInstitutionId) {
        const tickets = await getAllTicketsByInstitution(Number(storedInstitutionId));
        // Build lookup map
        for (const t of tickets) {
          ticketMap.set(t.ticket_id, t);
        }
        // Sort by updated_at descending, take the 10 most recently updated
        const sorted = [...tickets]
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 10);

        for (const t of sorted) {
          notifs.push({
            id: `ticket-${t.ticket_id}`,
            type: "ticket",
            title: t.ticket_id,
            subtitle: t.subject || t.status,
            ticketId: t.ticket_id,
            timestamp: t.updated_at,
            status: t.status,
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch ticket notifications:", err);
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const convRes: any = await ApiWrapper.getConversationsWithUnread();
      const convData = convRes?.response || convRes?.data || convRes;
      const conversations = Array.isArray(convData) ? convData : [];

      for (const conv of conversations) {
        if (conv.unread_count && conv.unread_count > 0) {
          notifs.push({
            id: `chat-${conv.conversation_id}`,
            type: "chat",
            title: conv.title,
            subtitle: conv.last_message || "New messages",
            conversationId: conv.conversation_id,
            timestamp: conv.last_message_time || conv.updated_at || conv.created_at,
            unreadCount: conv.unread_count,
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch chat notifications:", err);
    }

    // Sort all notifications by timestamp descending
    notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setNotifications(notifs);
    setRawTicketsMap(ticketMap);
    setNotificationsLoading(false);
  }, []);

  // Fetch notifications on mount and every 30 seconds
  // Wait until currentUser is resolved to avoid triggering a 401
  // that would clearAuth() before we know the user's role.
  useEffect(() => {
    if (currentUser === null || isSuperAdmin) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, isSuperAdmin, currentUser]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notif: Notification) => {
    setIsNotificationsOpen(false);
    if (notif.type === "ticket" && notif.ticketId) {
      // Open the ticket progress panel directly (no route change)
      const ticket = rawTicketsMap.get(notif.ticketId);
      if (ticket) {
        setSelectedTicket(ticket);
        setIsTicketPanelOpen(true);
      }
    } else if (notif.type === "chat" && notif.conversationId) {
      // Route directly to chat with the conversation selected
      router.push(`/chat?conversation=${notif.conversationId}`);
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return then.toLocaleDateString();
  };

  // Filter out dismissed notifications
  const visibleNotifications = notifications.filter((n) => !dismissedIds.includes(n.id));

  const unreadNotifCount = visibleNotifications
    .filter((n) => n.type === "chat" && n.unreadCount && n.unreadCount > 0)
    .reduce((sum, n) => sum + (n.unreadCount || 0), 0);

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
        // FIX: super-admins don't have access to /ticket/dashboard.
        // Point "Home" at their own dashboard so it doesn't bounce
        // them through a redirect on staff-protected routes.
        href: isSuperAdmin ? "/dashboard" : "/ticket/dashboard",
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
        {/* Notification Bell */}
        {!isSuperAdmin && (
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Bell size={20} className="text-gray-600" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full px-1">
                  {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-5 w-96 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                  {visibleNotifications.length > 0 && (
                    <button
                      onClick={() => {
                        // Dismiss all
                        setDismissedIds((prev) => {
                          const allIds = visibleNotifications.map((n) => n.id);
                          return [...new Set([...prev, ...allIds])];
                        });
                      }}
                      className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-[#1E4637] rounded-full animate-spin" />
                    </div>
                  ) : visibleNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                      <Bell size={32} className="mb-2 text-gray-300" />
                      <p className="text-sm font-medium">No notifications</p>
                      <p className="text-xs text-gray-400 mt-1">You&apos;re all caught up!</p>
                    </div>
                  ) : (
                    visibleNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="relative group border-b border-gray-50 last:border-b-0"
                      >
                        <button
                          onClick={() => handleNotificationClick(notif)}
                          className="w-full flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            notif.type === "ticket"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-emerald-100 text-emerald-600"
                          }`}>
                            {notif.type === "ticket" ? (
                              <Ticket size={16} />
                            ) : (
                              <MessageSquare size={16} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {notif.title}
                              </p>
                              {notif.status && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium shrink-0">
                                  {notif.status}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {notif.subtitle}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock size={10} className="text-gray-400" />
                              <span className="text-[10px] text-gray-400">
                                {formatRelativeTime(notif.timestamp)}
                              </span>
                              {notif.type === "ticket" && (
                                <span className="text-[10px] text-blue-400 ml-1">· View progress</span>
                              )}
                              {notif.type === "chat" && (
                                <span className="text-[10px] text-emerald-400 ml-1">· Open chat</span>
                              )}
                            </div>
                          </div>
                          {notif.type === "chat" && notif.unreadCount && notif.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-emerald-500 rounded-full shrink-0 mt-1">
                              {notif.unreadCount}
                            </span>
                          )}
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(notif.id);
                          }}
                          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                          aria-label="Dismiss notification"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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

      {/* Ticket Detail Panel — opened from notification click */}
      <TicketDetailPanel
        ticket={selectedTicket}
        isOpen={isTicketPanelOpen}
        onOpen={() => setIsTicketPanelOpen(true)}
        onClose={() => {
          setIsTicketPanelOpen(false);
          setSelectedTicket(null);
        }}
      />

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