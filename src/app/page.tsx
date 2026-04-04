"use client";

import { useAppStore } from "@/store/use-store";
import { BerandaView } from "@/components/beranda-view";
import { LoginView } from "@/components/login-view";
import { AdminDashboard } from "@/components/admin-dashboard";

export default function HomePage() {
  const hasHydrated = useAppStore((s) => s._hasHydrated);
  const view = useAppStore((s) => s.view);

  // Wait for zustand persist to rehydrate from localStorage
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-3 border-emerald-600 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-400">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {view === "beranda" && <BerandaView />}
      {view === "login" && <LoginView />}
      {view === "admin" && <AdminDashboard />}
    </div>
  );
}
