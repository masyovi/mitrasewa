"use client";

import { useAppStore } from "@/store/use-store";
import { BerandaView } from "@/components/beranda-view";
import { LoginView } from "@/components/login-view";
import { AdminDashboard } from "@/components/admin-dashboard";

export default function HomePage() {
  const view = useAppStore((s) => s.view);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {view === "beranda" && <BerandaView />}
      {view === "login" && <LoginView />}
      {view === "admin" && <AdminDashboard />}
    </div>
  );
}
