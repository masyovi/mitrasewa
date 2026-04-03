"use client";

import { useState, useMemo } from "react";
import {
  DollarSign,
  History,
  HardHat,
  Truck,
  Package,
  AlertTriangle,
  TrendingUp,
  Clock,
  X,
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowDown,
  Users,
  PlusCircle,
  RotateCcw,
  Timer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type RentalWithItems,
  type StockData,
} from "@/lib/types";
import { formatCurrency, formatDateShort } from "./helpers";

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} hari lalu`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} bulan lalu`;
}

export function DashboardTab({
  stockData,
  rentals,
}: {
  stockData: StockData[];
  rentals: RentalWithItems[];
}) {
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [lowStockDismissed, setLowStockDismissed] = useState(false);
  const scaffolding = stockData.find((s) => s.item === "scaffolding");
  const totalAktif = rentals.filter((r) => r.status === "aktif").length;
  const totalKembali = rentals.filter((r) => r.status === "kembali").length;
  const totalPendapatan = rentals.reduce((sum, r) => sum + r.totalHarga, 0);
  const totalPerbaikan = stockData.reduce((sum, s) => sum + s.perbaikan, 0);
  const totalAllItems = stockData.reduce((sum, s) => sum + s.total, 0);

  // Enhanced summary card values
  const totalTersedia = stockData.reduce((sum, s) => sum + s.tersedia, 0);
  const totalDisewa = stockData.reduce((sum, s) => sum + s.disewa, 0);
  const uniqueCustomers = new Set(rentals.map((r) => r.namaPenyewa.toLowerCase())).size;
  const thisMonthRevenue = rentals
    .filter((r) => {
      const d = new Date(r.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, r) => sum + r.totalHarga, 0);

  // Monthly summary values
  const sewaBaruBulanIni = rentals.filter((r) => {
    const d = new Date(r.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const sewaKembaliBulanIni = rentals.filter((r) => {
    if (r.status !== "kembali") return false;
    const d = new Date(r.updatedAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const thisMonthRentals = rentals.filter((r) => {
    const d = new Date(r.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const rataRataDurasi = thisMonthRentals.length > 0
    ? (thisMonthRentals.reduce((sum, r) => sum + r.lamaSewa, 0) / thisMonthRentals.length).toFixed(1)
    : "0";

  const overdueRentals = rentals.filter((r) => r.isOverdue);

  // Low stock: tersedia <= 10% of total, excluding fully disewa items (tersedia > 0)
  const lowStockItems = stockData.filter(
    (s) => s.total > 0 && s.tersedia > 0 && s.tersedia <= s.total * 0.1
  );

  // Popular equipment: top 3 most rented by total units
  const popularEquipment = useMemo(() => {
    const itemMap: Record<string, { item: string; label: string; totalJumlah: number }> = {};
    for (const rental of rentals) {
      for (const ri of rental.items) {
        if (!itemMap[ri.item]) {
          itemMap[ri.item] = { item: ri.item, label: ri.label, totalJumlah: 0 };
        }
        itemMap[ri.item].totalJumlah += ri.jumlah;
      }
    }
    return Object.values(itemMap)
      .sort((a, b) => b.totalJumlah - a.totalJumlah)
      .slice(0, 3);
  }, [rentals]);

  const maxRentedUnits = popularEquipment.length > 0
    ? popularEquipment[0].totalJumlah
    : 1;

  // Recent activities for timeline (sorted by createdAt desc, last 8)
  const recentActivities = useMemo(() => {
    return [...rentals]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [rentals]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500">
          Ringkasan data penyewaan &amp; stok alat
        </p>
      </div>

      {/* Overdue Warning Alert */}
      {overdueRentals.length > 0 && !warningDismissed && (
        <div className="animate-fade-in-up rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-5 shadow-md">
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <div className="bg-amber-100 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-amber-800 text-sm sm:text-base">
                  Peringatan: {overdueRentals.length} Penyewaan Terlambat!
                </h3>
                <Badge className="bg-amber-500 text-white badge-pulse border-0">
                  {overdueRentals.length} telat
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-amber-700 mb-3">
                Ada penyewaan yang sudah melewati tanggal pengembalian. Segera hubungi penyewa untuk mengembalikan alat.
              </p>
              <div className="bg-white/60 rounded-lg border border-amber-100 p-3 max-h-40 overflow-y-auto">
                <div className="space-y-2">
                  {overdueRentals.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span className="font-medium text-gray-800 truncate">
                          {r.namaPenyewa}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className="bg-red-100 text-red-700 border-0 text-[11px] px-1.5 py-0">
                          Terlambat {r.daysOverdue} hari
                        </Badge>
                        <span className="text-xs text-gray-500 font-medium">
                          {formatCurrency(r.totalHarga)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setWarningDismissed(true)}
              className="flex-shrink-0 p-1 rounded-md text-amber-400 hover:text-amber-600 hover:bg-amber-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Low Stock Warning Alert */}
      {lowStockItems.length > 0 && !lowStockDismissed && (
        <div className="animate-fade-in-up rounded-xl border border-amber-200 bg-gradient-to-r from-yellow-50 to-amber-50 p-4 sm:p-5 shadow-md">
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <div className="bg-amber-100 p-2 rounded-lg">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-amber-800 text-sm sm:text-base">
                  Peringatan Stok Rendah!
                </h3>
                <Badge className="bg-yellow-500 text-white badge-pulse border-0">
                  {lowStockItems.length} alat
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-amber-700 mb-3">
                Beberapa alat memiliki ketersediaan di bawah 10%. Pertimbangkan untuk menambah stok.
              </p>
              <div className="bg-white/60 rounded-lg border border-amber-100 p-3 max-h-48 overflow-y-auto">
                <div className="space-y-3">
                  {lowStockItems.map((item) => {
                    const pct = item.total > 0 ? (item.tersedia / item.total) * 100 : 0;
                    return (
                      <div key={item.item} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            <span className="font-medium text-gray-800 truncate">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge className="bg-red-100 text-red-700 border-0 text-[11px] px-1.5 py-0">
                              {item.tersedia} / {item.total} {item.unit}
                            </Badge>
                            <span className="text-xs text-gray-500 font-medium">
                              {pct.toFixed(0)}% tersedia
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 progress-bar-animate rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <button
              onClick={() => setLowStockDismissed(true)}
              className="flex-shrink-0 p-1 rounded-md text-amber-400 hover:text-amber-600 hover:bg-amber-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-0 shadow-md card-elevated hover-lift animate-fade-in-up">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2 rounded-lg">
                <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 animate-count-up stat-number">
              {totalTersedia}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Unit Tersedia</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md card-elevated hover-lift animate-fade-in-up animate-fade-in-up-delay-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-lg">
                <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 animate-count-up stat-number">
              {totalDisewa}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Disewa</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md card-elevated hover-lift animate-fade-in-up animate-fade-in-up-delay-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg">
                <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 animate-count-up stat-number">
              {formatCurrency(thisMonthRevenue)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Pendapatan Bulan Ini</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md card-elevated hover-lift animate-fade-in-up animate-fade-in-up-delay-3">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-violet-100 dark:bg-violet-900/40 p-2 rounded-lg">
                <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 animate-count-up stat-number">
              {uniqueCustomers}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Pelanggan</p>
          </CardContent>
        </Card>
      </div>

      {/* Ringkasan Bulanan */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 sm:p-4 flex items-center gap-3 animate-fade-in-up">
          <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2 rounded-lg flex-shrink-0">
            <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-400 animate-count-up stat-number">
              {sewaBaruBulanIni}
            </p>
            <p className="text-[11px] sm:text-xs text-emerald-600 dark:text-emerald-500 truncate">Sewa Baru Bulan Ini</p>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 sm:p-4 flex items-center gap-3 animate-fade-in-up animate-fade-in-up-delay-1">
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg flex-shrink-0">
            <RotateCcw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300 animate-count-up stat-number">
              {sewaKembaliBulanIni}
            </p>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">Sewa Kembali Bulan Ini</p>
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 sm:p-4 flex items-center gap-3 animate-fade-in-up animate-fade-in-up-delay-2">
          <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg flex-shrink-0">
            <Timer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-400 animate-count-up stat-number">
              {rataRataDurasi}
            </p>
            <p className="text-[11px] sm:text-xs text-blue-600 dark:text-blue-500 truncate">Rata-rata Durasi (hari)</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-0 shadow-md bg-emerald-50 card-elevated hover-lift animate-fade-in-up">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-700 animate-count-up stat-number">{totalAktif}</p>
            <p className="text-sm text-emerald-600">Sewa Aktif</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gray-50 card-elevated hover-lift animate-fade-in-up animate-fade-in-up-delay-1">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-700 animate-count-up stat-number">
              {totalKembali}
            </p>
            <p className="text-sm text-gray-600">Sudah Kembali</p>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-md card-elevated hover-lift animate-fade-in-up animate-fade-in-up-delay-2 ${totalPerbaikan > 0 ? "bg-orange-50" : "bg-gray-50"}`}>
          <CardContent className="p-4 text-center">
            <p className={`text-3xl font-bold animate-count-up stat-number ${totalPerbaikan > 0 ? "text-orange-700" : "text-gray-700"}`}>
              {totalPerbaikan}
            </p>
            <p className={`text-sm ${totalPerbaikan > 0 ? "text-orange-600" : "text-gray-600"}`}>
              {totalPerbaikan > 0 && <AlertTriangle className="w-3.5 h-3.5 inline mr-0.5" />}
              Perbaikan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Table */}
      <Card className="border-0 shadow-md card-elevated animate-fade-in-up">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <HardHat className="w-5 h-5 text-emerald-600" />
            Stok Semua Alat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="table-modern">
              <TableHeader>
                <TableRow>
                  <TableHead>Barang</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Disewa</TableHead>
                  <TableHead className="text-center">Perbaikan</TableHead>
                  <TableHead className="text-center">Tersedia</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockData.map((item) => (
                  <TableRow key={item.item} className="transition-colors hover:bg-gray-50/50">
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell className="text-center">
                      {item.total} {item.unit}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-amber-600 font-medium">
                        {item.disewa}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.perbaikan > 0 ? (
                        <span className="text-orange-600 font-medium flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {item.perbaikan}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-emerald-600 font-medium">
                        {item.tersedia}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={
                          item.perbaikan > 0
                            ? "bg-orange-100 text-orange-700"
                            : item.tersedia > 0
                            ? "status-ready"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {item.perbaikan > 0
                          ? "Perbaikan"
                          : item.tersedia > 0
                          ? "Ready"
                          : "Habis"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Rentals */}
      <Card className="border-0 shadow-md card-elevated animate-fade-in-up animate-fade-in-up-delay-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            Penyewaan Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rentals.length === 0 ? (
            <div className="text-center py-14">
              <div className="mx-auto mb-4 bg-emerald-50 rounded-2xl p-4 w-fit">
                <Clock className="w-14 h-14 text-emerald-200" />
              </div>
              <p className="text-gray-500 text-sm font-medium">
                Belum ada data penyewaan
              </p>
              <p className="text-gray-400 text-xs mt-1.5 max-w-[240px] mx-auto">
                Data akan muncul setelah input sewa pertama melalui tab &quot;Input Sewa&quot;
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Penyewa</TableHead>
                    <TableHead className="hidden sm:table-cell">Barang</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rentals.slice(0, 5).map((r) => (
                    <TableRow key={r.id} className="transition-colors hover:bg-gray-50/50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{r.namaPenyewa}</p>
                          <p className="text-xs text-gray-400">{r.noHp}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {r.items.map((i) => i.label).join(", ")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            r.status === "aktif"
                              ? "status-disewa"
                              : "bg-emerald-100 text-emerald-700"
                          }
                        >
                          {r.status === "aktif" ? "Disewa" : "Kembali"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        {formatCurrency(r.totalHarga)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular Equipment Quick View */}
      {popularEquipment.length > 0 && (
        <Card className="border-0 shadow-md card-elevated animate-fade-in-up animate-fade-in-up-delay-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Peralatan Populer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {popularEquipment.map((eq, idx) => {
                const pct = maxRentedUnits > 0 ? (eq.totalJumlah / maxRentedUnits) * 100 : 0;
                return (
                  <div
                    key={eq.item}
                    className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        #{idx + 1}
                      </span>
                      <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0 border-0">
                        {eq.totalJumlah} unit
                      </Badge>
                    </div>
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-3">
                      {eq.label}
                    </p>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 progress-bar-animate rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Timeline */}
      <Card className="border-0 shadow-md card-elevated animate-fade-in-up animate-fade-in-up-delay-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ArrowDown className="w-5 h-5 text-emerald-600" />
            Aktivitas Terkini
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">Belum ada aktivitas</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
              <div className="space-y-3">
                {recentActivities.map((r, idx) => {
                  const isReturned = r.status === "kembali";
                  const isOverdue = r.isOverdue;
                  const dotColor = isReturned
                    ? "bg-emerald-500"
                    : isOverdue
                      ? "bg-red-500"
                      : "bg-amber-500";
                  const iconBg = isReturned
                    ? "bg-emerald-100 text-emerald-600"
                    : isOverdue
                      ? "bg-red-100 text-red-600"
                      : "bg-amber-100 text-amber-600";
                  const ActivityIcon = isReturned
                    ? ArrowUpCircle
                    : isOverdue
                      ? AlertTriangle
                      : ArrowDownCircle;
                  const activityLabel = isReturned
                    ? "mengembalikan"
                    : isOverdue
                      ? "terlambat"
                      : "menyewa";
                  const itemCount = r.items.length;
                  const itemText =
                    itemCount === 1
                      ? r.items[0].label
                      : r.items.map((i) => i.label).join(", ");

                  return (
                    <div
                      key={r.id}
                      className="flex items-start gap-3 sm:gap-4 animate-fade-in-up"
                      style={{
                        animationDelay: `${idx * 80}ms`,
                        animationFillMode: "both",
                      }}
                    >
                      {/* Left: dot + line (desktop) */}
                      <div className="hidden sm:flex flex-col items-center relative z-10 flex-shrink-0 w-[22px]">
                        <div
                          className={`w-3 h-3 rounded-full ${dotColor} ring-4 ring-white dark:ring-gray-900 flex-shrink-0`}
                        />
                      </div>

                      {/* Right: activity card */}
                      <div className="flex-1 min-w-0">
                        {/* Desktop version */}
                        <div className="hidden sm:block bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div
                                className={`${iconBg} p-1.5 rounded-lg flex-shrink-0 mt-0.5`}
                              >
                                <ActivityIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm">
                                  <span className="font-bold text-gray-900 dark:text-gray-100">
                                    {r.namaPenyewa}
                                  </span>{" "}
                                  <span className="text-gray-500 dark:text-gray-400">
                                    {activityLabel} {itemCount} alat
                                  </span>
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                                  {itemText}
                                </p>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                                  {timeAgo(r.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {formatCurrency(r.totalHarga)}
                              </p>
                              {isOverdue && r.daysOverdue !== undefined && (
                                <Badge className="bg-red-100 text-red-700 border-0 text-[10px] px-1.5 py-0 mt-1">
                                  Terlambat {r.daysOverdue} hari
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Mobile version (simplified) */}
                        <div className="sm:hidden bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`${iconBg} p-1.5 rounded-lg flex-shrink-0`}
                            >
                              <ActivityIcon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {r.namaPenyewa}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                {timeAgo(r.createdAt)}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">
                            {formatCurrency(r.totalHarga)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
