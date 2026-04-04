"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAppStore, type AdminTab } from "@/store/use-store";
import {
  Building2,
  LogOut,
  LayoutDashboard,
  FilePlus,
  DollarSign,
  History,
  BarChart3,
  Users,
  Menu,
  X,
  Info,
  CalendarDays,
  Tag,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  type RentalWithItems,
  type StockData,
  type PriceData,
} from "@/lib/types";
import { AboutModal } from "@/components/about-modal";

const DashboardTab = dynamic(() => import("./dashboard-tab").then((mod) => ({ default: mod.DashboardTab })), {
  loading: () => <Skeleton className="h-64 rounded-xl" />,
});
const InputSewaTab = dynamic(() => import("./input-sewa-tab").then((mod) => ({ default: mod.InputSewaTab })), {
  loading: () => <Skeleton className="h-64 rounded-xl" />,
});
const HargaTab = dynamic(() => import("./harga-tab").then((mod) => ({ default: mod.HargaTab })), {
  loading: () => <Skeleton className="h-64 rounded-xl" />,
});
const HistoryTab = dynamic(() => import("./history-tab").then((mod) => ({ default: mod.HistoryTab })), {
  loading: () => <Skeleton className="h-64 rounded-xl" />,
});
const LaporanTab = dynamic(() => import("./laporan-tab").then((mod) => ({ default: mod.LaporanTab })), {
  loading: () => <Skeleton className="h-64 rounded-xl" />,
});
const PelangganTab = dynamic(() => import("./pelanggan-tab").then((mod) => ({ default: mod.PelangganTab })), {
  loading: () => <Skeleton className="h-64 rounded-xl" />,
});

export function AdminDashboard() {
  const { adminTab, setAdminTab, logout, sidebarOpen, setSidebarOpen } =
    useAppStore();
  const { toast } = useToast();

  const [stockData, setStockData] = useState<StockData[]>([]);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [rentals, setRentals] = useState<RentalWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);

  const overdueCount = rentals.filter((r) => r.isOverdue && r.status === "aktif").length;

  const fetchAll = useCallback(async () => {
    try {
      const [stockRes, priceRes, rentalRes] = await Promise.all([
        fetch("/api/stock"),
        fetch("/api/prices"),
        fetch("/api/rentals"),
      ]);
      const [stockJson, priceJson, rentalJson] = await Promise.all([
        stockRes.json(),
        priceRes.json(),
        rentalRes.json(),
      ]);
      if (stockJson.success) setStockData(stockJson.data);
      if (priceJson.success) setPriceData(priceJson.data);
      if (rentalJson.success) setRentals(rentalJson.data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleExportCSV = async () => {
    try {
      const res = await fetch("/api/export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `history_penyewaan_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Export berhasil",
        description: "File CSV telah diunduh",
      });
    } catch {
      toast({
        title: "Export gagal",
        description: "Terjadi kesalahan saat mengunduh file",
        variant: "destructive",
      });
    }
  };

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "input", label: "Input Sewa", icon: <FilePlus className="w-4 h-4" /> },
    { id: "harga", label: "Setting Harga", icon: <DollarSign className="w-4 h-4" /> },
    { id: "history", label: "History", icon: <History className="w-4 h-4" /> },
    { id: "pelanggan", label: "Pelanggan", icon: <Users className="w-4 h-4" /> },
    { id: "laporan", label: "Laporan", icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-mitra-gradient text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors lg:hidden"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              <div>
                <h1 className="text-lg font-bold leading-tight">
                  MITRA SEWA
                </h1>
                <p className="text-[10px] sm:text-xs text-white/70">
                  Panel Admin
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAboutOpen(true)}
              className="text-white/80 hover:text-white hover:bg-white/20"
            >
              <Info className="w-4 h-4" />
            </Button>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (adminTab !== "dashboard") setAdminTab("dashboard");
                }}
                className="text-white/80 hover:text-white hover:bg-white/20 transition-all"
                aria-label="Notifikasi"
              >
                <Bell className="w-4 h-4" />
              </Button>
              {overdueCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                  {overdueCount > 9 ? "9+" : overdueCount}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-white/90 hover:text-white hover:bg-white/20 gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 p-4 min-h-0">
          <nav className="space-y-1 flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id)}
                className={`sidebar-item ${adminTab === tab.id ? "sidebar-item-active" : ""}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
          {/* Dashboard Info */}
          <div className="mt-auto pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs text-gray-400">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                Versi 2.0
              </span>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="fixed inset-0 bg-black/40"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed left-0 top-[52px] bottom-0 w-64 bg-white shadow-xl p-4 z-50 animate-slide-in-left">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setAdminTab(tab.id);
                      setSidebarOpen(false);
                    }}
                    className={`sidebar-item ${adminTab === tab.id ? "sidebar-item-active" : ""}`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </aside>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {/* Top tab buttons hidden on mobile (replaced by bottom nav) and on desktop (replaced by sidebar) */}

          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {adminTab === "dashboard" && (
                <DashboardTab stockData={stockData} rentals={rentals} />
              )}
              {adminTab === "input" && (
                <InputSewaTab
                  priceData={priceData}
                  stockData={stockData}
                  rentals={rentals}
                  onSuccess={fetchAll}
                />
              )}
              {adminTab === "harga" && (
                <HargaTab
                  priceData={priceData}
                  stockData={stockData}
                  onSuccess={fetchAll}
                />
              )}
              {adminTab === "history" && (
                <HistoryTab
                  rentals={rentals}
                  onRefresh={fetchAll}
                  onExport={handleExportCSV}
                />
              )}
              {adminTab === "pelanggan" && <PelangganTab rentals={rentals} />}
              {adminTab === "laporan" && <LaporanTab />}
            </>
          )}
        </main>
      </div>

      <footer className="bg-mitra-gradient text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-white/60">
            &copy; {new Date().getFullYear()} MITRA SEWA - Panel Admin
          </p>
          <p className="text-xs text-white/50">
            Didukung oleh <span className="font-semibold text-white/70">Pengelola Gedung Pusat BMT NU Ngasem Group</span>
          </p>
        </div>
      </footer>

      <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />
    </div>
  );
}
