import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppView = "beranda" | "login" | "admin";

export type AdminTab =
  | "dashboard"
  | "input"
  | "harga"
  | "history"
  | "laporan"
  | "pelanggan";

interface AppState {
  view: AppView;
  adminTab: AdminTab;
  isLoggedIn: boolean;
  sidebarOpen: boolean;
  _hasHydrated: boolean;

  setView: (view: AppView) => void;
  setAdminTab: (tab: AdminTab) => void;
  login: () => void;
  logout: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      view: "beranda" as AppView,
      adminTab: "dashboard" as AdminTab,
      isLoggedIn: false,
      sidebarOpen: false,
      _hasHydrated: false,

      setView: (view) => set({ view }),
      setAdminTab: (tab) => set({ adminTab: tab }),
      login: () =>
        set({ isLoggedIn: true, view: "admin", adminTab: "dashboard" }),
      logout: () =>
        set({
          isLoggedIn: false,
          view: "beranda",
          adminTab: "dashboard",
        }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "mitra-sewa-auth",
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        view: state.view,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) state.setHasHydrated(true);
        };
      },
    }
  )
);
