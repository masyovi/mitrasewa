"use client";

import { useAppStore } from "@/store/use-store";
import { BerandaView } from "@/components/beranda-view";
import { LoginView } from "@/components/login-view";
import { AdminDashboard } from "@/components/admin-dashboard";

function LoadingCar() {
  return (
    <div className="loading-car-scene">
      {/* Clouds */}
      <svg className="cloud" width="50" height="20" viewBox="0 0 50 20">
        <ellipse cx="25" cy="12" rx="20" ry="8" fill="oklch(0.92 0.03 155)" />
        <ellipse cx="15" cy="10" rx="12" ry="6" fill="oklch(0.93 0.03 155)" />
        <ellipse cx="35" cy="11" rx="10" ry="5" fill="oklch(0.94 0.02 155)" />
      </svg>
      <svg className="cloud" width="40" height="16" viewBox="0 0 40 16">
        <ellipse cx="20" cy="10" rx="16" ry="6" fill="oklch(0.92 0.03 155)" />
        <ellipse cx="12" cy="8" rx="10" ry="5" fill="oklch(0.93 0.03 155)" />
      </svg>

      {/* Car */}
      <svg className="car" width="90" height="50" viewBox="0 0 90 50">
        {/* Car body bottom */}
        <rect x="5" y="20" width="80" height="18" rx="4" fill="oklch(0.55 0.17 163)" />
        {/* Car body top (cabin) */}
        <path d="M22 20 L28 6 Q30 3 34 3 L56 3 Q60 3 62 6 L68 20 Z" fill="oklch(0.50 0.18 160)" />
        {/* Windows */}
        <path d="M30 18 L35 7 Q36 5 38 5 L47 5 L47 18 Z" fill="oklch(0.92 0.04 180)" opacity="0.8" />
        <path d="M49 18 L49 5 L55 5 Q57 5 58 7 L63 18 Z" fill="oklch(0.92 0.04 180)" opacity="0.8" />
        {/* Headlight */}
        <rect x="82" y="25" width="5" height="6" rx="2" fill="oklch(0.92 0.06 90)" />
        {/* Taillight */}
        <rect x="3" y="25" width="4" height="5" rx="2" fill="oklch(0.55 0.2 25)" />
        {/* Door handle */}
        <rect x="50" y="22" width="6" height="2" rx="1" fill="oklch(0.45 0.15 163)" />
        {/* Bumper line */}
        <rect x="8" y="36" width="74" height="2" rx="1" fill="oklch(0.45 0.15 163)" />
        {/* Wheels */}
        <g className="wheel" style={{ transformOrigin: '25px 40px' }}>
          <circle cx="25" cy="40" r="9" fill="oklch(0.25 0.02 155)" />
          <circle cx="25" cy="40" r="5" fill="oklch(0.70 0.06 155)" />
          <circle cx="25" cy="40" r="2" fill="oklch(0.50 0.04 155)" />
        </g>
        <g className="wheel" style={{ transformOrigin: '65px 40px' }}>
          <circle cx="65" cy="40" r="9" fill="oklch(0.25 0.02 155)" />
          <circle cx="65" cy="40" r="5" fill="oklch(0.70 0.06 155)" />
          <circle cx="65" cy="40" r="2" fill="oklch(0.50 0.04 155)" />
        </g>
      </svg>

      {/* Smoke */}
      <div className="smoke">
        <div className="smoke-circle" />
        <div className="smoke-circle" />
        <div className="smoke-circle" />
      </div>

      {/* Road */}
      <div className="road" />
    </div>
  );
}

export default function HomePage() {
  const hasHydrated = useAppStore((s) => s._hasHydrated);
  const view = useAppStore((s) => s.view);

  // Wait for zustand persist to rehydrate from localStorage
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingCar />
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
