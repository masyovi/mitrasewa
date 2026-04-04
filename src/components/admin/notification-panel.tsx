"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Bell,
  BellOff,
  AlertTriangle,
  Package,
  Info,
  CheckCheck,
  Trash2,
  X,
  BellRing,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotificationStore, type AppNotification, type NotificationType } from "@/store/use-notifications";
import { useAppStore, type AdminTab } from "@/store/use-store";
import type { RentalWithItems, StockData } from "@/lib/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NotificationPanelProps {
  rentals: RentalWithItems[];
  stockData: StockData[];
  overdueCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHr < 24) return `${diffHr} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return new Date(timestamp).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "overdue":
      return <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />;
    case "stock":
      return <Package className="w-4 h-4 text-amber-500 shrink-0" />;
    case "system":
      return <BellRing className="w-4 h-4 text-emerald-500 shrink-0" />;
    case "info":
      return <Info className="w-4 h-4 text-sky-500 shrink-0" />;
  }
}

function getNotificationBg(type: NotificationType): string {
  switch (type) {
    case "overdue":
      return "bg-red-50 dark:bg-red-950/30";
    case "stock":
      return "bg-amber-50 dark:bg-amber-950/30";
    case "system":
      return "bg-emerald-50 dark:bg-emerald-950/30";
    case "info":
      return "bg-sky-50 dark:bg-sky-950/30";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationPanel({
  rentals,
  stockData,
  overdueCount,
}: NotificationPanelProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const {
    notifications,
    notificationPermission,
    markAsRead,
    markAllRead,
    clearAll,
    requestPermission,
    generateFromData,
  } = useNotificationStore();

  const setAdminTab = useAppStore((s) => s.setAdminTab);

  // Unread count
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  // Badge count = max of overdue + unread
  const badgeCount = useMemo(
    () => Math.max(overdueCount, unreadCount),
    [overdueCount, unreadCount],
  );

  // Auto-generate notifications from data
  useEffect(() => {
    if (rentals.length > 0 || stockData.length > 0) {
      generateFromData(rentals, stockData);
    }
  }, [rentals, stockData, generateFromData]);

  // Welcome notification (once)
  useEffect(() => {
    const hasWelcome = useNotificationStore.getState().notifications.some(
      (n) => n.type === "system" && n.title.includes("Selamat datang"),
    );
    if (!hasWelcome) {
      useNotificationStore.getState().addNotification({
        type: "system",
        title: "Selamat datang di Panel Admin MITRA SEWA",
        message: "Anda akan menerima notifikasi penting terkait sewa dan stok di sini.",
      });
    }
  }, []);

  // Request permission on first open
  useEffect(() => {
    if (open && notificationPermission === "default") {
      requestPermission();
    }
  }, [open, notificationPermission, requestPermission]);

  // Click outside to close
  const handleClickOutside = useCallback((e: MouseEvent) => {
    const target = e.target as Node;
    if (
      panelRef.current &&
      !panelRef.current.contains(target) &&
      buttonRef.current &&
      !buttonRef.current.contains(target)
    ) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open, handleClickOutside]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open]);

  // Handle notification click → mark as read + optionally navigate
  const handleNotificationClick = (notification: AppNotification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      setAdminTab(notification.actionUrl);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        onClick={() => setOpen((prev) => !prev)}
        className="text-white/80 hover:text-white hover:bg-white/20 transition-all"
        aria-label="Notifikasi"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell
          className={`w-4 h-4 transition-transform ${
            badgeCount > 0 && !open ? "animate-bell-ring" : ""
          }`}
        />
      </Button>

      {/* Badge */}
      {badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse pointer-events-none">
          {badgeCount > 9 ? "9+" : badgeCount}
        </span>
      )}

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-[60] animate-notif-slide-down overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/60">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Notifikasi
              </h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Tutup notifikasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <Separator />

          {/* Permission banner */}
          {notificationPermission === "default" && (
            <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-100 dark:border-amber-900/40">
              <div className="flex items-center gap-2">
                <BellOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                    Notifikasi browser belum aktif
                  </p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                    Aktifkan untuk menerima pemberitahuan penting
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-[11px] font-medium border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 shrink-0"
                  onClick={() => requestPermission()}
                >
                  Aktifkan
                </Button>
              </div>
            </div>
          )}

          {/* Notification list */}
          <ScrollArea className="max-h-[420px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                  <BellOff className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Belum ada notifikasi
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Notifikasi penting akan muncul di sini
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-4 py-3 flex gap-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 group ${
                      notification.read ? "opacity-70" : ""
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${getNotificationBg(notification.type)}`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight truncate">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                        {getRelativeTime(notification.timestamp)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 gap-1.5"
                  onClick={() => markAllRead()}
                  disabled={unreadCount === 0}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Tandai semua dibaca
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1.5"
                  onClick={() => clearAll()}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus semua
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
