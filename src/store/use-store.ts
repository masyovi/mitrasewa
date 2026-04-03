import { create } from "zustand";

export type AppView = "beranda" | "login" | "admin";

export type AdminTab =
  | "dashboard"
  | "input"
  | "harga"
  | "history"
  | "laporan";

interface AppState {
  view: AppView;
  adminTab: AdminTab;
  isLoggedIn: boolean;
  sidebarOpen: boolean;

  setView: (view: AppView) => void;
  setAdminTab: (tab: AdminTab) => void;
  login: () => void;
  logout: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "beranda",
  adminTab: "dashboard",
  isLoggedIn: false,
  sidebarOpen: false,

  setView: (view) => set({ view }),
  setAdminTab: (tab) => set({ adminTab: tab }),
  login: () => set({ isLoggedIn: true, view: "admin", adminTab: "dashboard" }),
  logout: () => set({ isLoggedIn: false, view: "beranda", adminTab: "dashboard" }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
