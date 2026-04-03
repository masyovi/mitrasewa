"use client";

import { useState } from "react";
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

export function DashboardTab({
  stockData,
  rentals,
}: {
  stockData: StockData[];
  rentals: RentalWithItems[];
}) {
  const [warningDismissed, setWarningDismissed] = useState(false);
  const scaffolding = stockData.find((s) => s.item === "scaffolding");
  const totalAktif = rentals.filter((r) => r.status === "aktif").length;
  const totalKembali = rentals.filter((r) => r.status === "kembali").length;
  const totalPendapatan = rentals.reduce((sum, r) => sum + r.totalHarga, 0);
  const totalPerbaikan = stockData.reduce((sum, s) => sum + s.perbaikan, 0);
  const totalAllItems = stockData.reduce((sum, s) => sum + s.total, 0);

  const overdueRentals = rentals.filter((r) => r.isOverdue);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500">
          Ringkasan data penyewaan & stok alat
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-0 shadow-md card-elevated animate-fade-in-up">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <Package className="w-4 h-4 text-emerald-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 animate-count-up stat-number">
              {scaffolding?.total ?? 0}
            </p>
            <p className="text-xs text-gray-500">Total Scaffolding (Set)</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md card-elevated animate-fade-in-up animate-fade-in-up-delay-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-amber-100 p-2 rounded-lg">
                <Truck className="w-4 h-4 text-amber-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 animate-count-up stat-number">
              {scaffolding?.disewa ?? 0}
            </p>
            <p className="text-xs text-gray-500">Scaffolding Disewa</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md card-elevated animate-fade-in-up animate-fade-in-up-delay-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <Package className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 animate-count-up stat-number">
              {scaffolding?.tersedia ?? 0}
            </p>
            <p className="text-xs text-gray-500">Scaffolding Tersedia</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md card-elevated animate-fade-in-up animate-fade-in-up-delay-3">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900 animate-count-up stat-number">
              {formatCurrency(totalPendapatan)}
            </p>
            <p className="text-xs text-gray-500">Total Pendapatan</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-0 shadow-md bg-emerald-50 card-elevated animate-fade-in-up">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-700 animate-count-up stat-number">{totalAktif}</p>
            <p className="text-sm text-emerald-600">Sewa Aktif</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gray-50 card-elevated animate-fade-in-up animate-fade-in-up-delay-1">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-700 animate-count-up stat-number">
              {totalKembali}
            </p>
            <p className="text-sm text-gray-600">Sudah Kembali</p>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-md card-elevated animate-fade-in-up animate-fade-in-up-delay-2 ${totalPerbaikan > 0 ? "bg-orange-50" : "bg-gray-50"}`}>
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
            <Table>
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
            <div className="text-center py-10">
              <Clock className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                Belum ada data penyewaan
              </p>
              <p className="text-gray-300 text-xs mt-1">
                Data akan muncul setelah input sewa pertama
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
    </div>
  );
}
