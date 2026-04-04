"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdminTab } from "./use-store";
import type { RentalWithItems, StockData } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationType = "overdue" | "stock" | "system" | "info";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: number;
  read: boolean;
  actionUrl?: AdminTab;
}

export type NotificationPermission = "default" | "granted" | "denied";

interface NotificationState {
  notifications: AppNotification[];
  notificationPermission: NotificationPermission;

  // Actions
  addNotification: (notification: Omit<AppNotification, "id" | "timestamp" | "read">) => string;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  requestPermission: () => Promise<void>;
  generateFromData: (rentals: RentalWithItems[], stockData: StockData[]) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a unique ID */
function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Build a dedupe key so we don't create duplicate notifications */
function dedupeKey(n: { type: NotificationType; title: string; message: string }): string {
  return `${n.type}:${n.title}:${n.message}`;
}

/** Send a browser push notification (no‑op on servers / unsupported browsers) */
function pushBrowser(title: string, body: string): void {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="oklch(0.55 0.17 155)"/><text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" font-size="32" fill="white" font-family="system-ui">🏠</text></svg>`;
    const iconUrl = `data:image/svg+xml,${encodeURIComponent(iconSvg)}`;

    new Notification(title, {
      body,
      icon: iconUrl,
      badge: iconUrl,
      tag: title, // prevents stacking identical notifications
    });
  } catch {
    // silently ignore if Notification constructor fails
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      notificationPermission: "default" as NotificationPermission,

      // ---- addNotification ----
      addNotification: (partial) => {
        const id = uid();
        const notification: AppNotification = {
          ...partial,
          id,
          timestamp: Date.now(),
          read: false,
        };

        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 50), // cap at 50
        }));

        // Push to browser if permission granted
        if (partial.type === "overdue" || partial.type === "stock") {
          pushBrowser(partial.title, partial.message);
        }

        return id;
      },

      // ---- markAsRead ----
      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        }));
      },

      // ---- markAllRead ----
      markAllRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      // ---- clearAll ----
      clearAll: () => set({ notifications: [] }),

      // ---- requestPermission ----
      requestPermission: async () => {
        if (typeof window === "undefined") return;
        if (!("Notification" in window)) {
          set({ notificationPermission: "denied" });
          return;
        }

        if (Notification.permission === "granted") {
          set({ notificationPermission: "granted" });
          return;
        }

        if (Notification.permission !== "denied") {
          const permission = await Notification.requestPermission();
          set({ notificationPermission: permission });
        } else {
          set({ notificationPermission: "denied" });
        }
      },

      // ---- generateFromData ----
      generateFromData: (rentals: RentalWithItems[], stockData: StockData[]) => {
        const existing = get().notifications;
        const existingKeys = new Set(existing.map((n) => dedupeKey(n)));

        const newNotifications: Omit<AppNotification, "id" | "timestamp" | "read">[] = [];

        // 1. Overdue rentals
        const overdueRentals = rentals.filter(
          (r) => r.isOverdue && r.status === "aktif",
        );
        for (const rental of overdueRentals) {
          const days = rental.daysOverdue ?? 0;
          const key = dedupeKey({
            type: "overdue",
            title: `Sewa Jatuh Tempo — ${rental.namaPenyewa}`,
            message: `Terlambat ${days} hari. Segera tindak lanjuti pengembalian.`,
          });
          if (!existingKeys.has(key)) {
            newNotifications.push({
              type: "overdue",
              title: `Sewa Jatuh Tempo — ${rental.namaPenyewa}`,
              message: `Terlambat ${days} hari. Segera tindak lanjuti pengembalian.`,
              actionUrl: "history" as AdminTab,
            });
            existingKeys.add(key);
          }
        }

        // 2. Low stock warnings
        for (const stock of stockData) {
          if (stock.tersedia === 0) {
            const key = dedupeKey({
              type: "stock",
              title: `Stok Habis — ${stock.label}`,
              message: `${stock.item} (${stock.unit}) tidak tersedia saat ini.`,
            });
            if (!existingKeys.has(key)) {
              newNotifications.push({
                type: "stock",
                title: `Stok Habis — ${stock.label}`,
                message: `${stock.item} (${stock.unit}) tidak tersedia saat ini.`,
                actionUrl: "dashboard" as AdminTab,
              });
              existingKeys.add(key);
            }
          } else if (stock.tersedia <= 2) {
            const key = dedupeKey({
              type: "stock",
              title: `Stok Menipis — ${stock.label}`,
              message: `Tersisa ${stock.tersedia} ${stock.unit}. Pertimbangkan untuk menambah stok.`,
            });
            if (!existingKeys.has(key)) {
              newNotifications.push({
                type: "stock",
                title: `Stok Menipis — ${stock.label}`,
                message: `Tersisa ${stock.tersedia} ${stock.unit}. Pertimbangkan untuk menambah stok.`,
                actionUrl: "dashboard" as AdminTab,
              });
              existingKeys.add(key);
            }
          }
        }

        // Batch-add all new notifications
        const store = get();
        for (const n of newNotifications) {
          store.addNotification(n);
        }
      },
    }),
    {
      name: "mitra-sewa-notifications",
      partialize: (state) => ({
        notifications: state.notifications,
        notificationPermission: state.notificationPermission,
      }),
    }
  )
);
