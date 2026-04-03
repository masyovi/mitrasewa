"use client";

import { useState, useMemo } from "react";
import {
  Users,
  UserCheck,
  Wallet,
  Search,
  ChevronDown,
  ChevronUp,
  Phone,
  MapPin,
  Calendar,
  Package,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { RentalWithItems } from "@/lib/types";
import { formatCurrency, formatDateShort } from "./helpers";

interface CustomerSummary {
  name: string;
  phone: string;
  address: string;
  rentalCount: number;
  totalSpent: number;
  firstRentalDate: string;
  lastRentalDate: string;
  hasActive: boolean;
  hasOverdue: boolean;
  rentals: RentalWithItems[];
}

function deriveCustomers(rentals: RentalWithItems[]): CustomerSummary[] {
  const customerMap = new Map<string, CustomerSummary>();

  for (const rental of rentals) {
    const key = `${rental.namaPenyewa}::${rental.noHp}`;
    const existing = customerMap.get(key);

    if (existing) {
      existing.rentalCount += 1;
      existing.totalSpent += rental.totalHarga;
      if (rental.createdAt < existing.firstRentalDate) {
        existing.firstRentalDate = rental.createdAt;
      }
      if (rental.createdAt > existing.lastRentalDate) {
        existing.lastRentalDate = rental.createdAt;
      }
      if (rental.status === "aktif") existing.hasActive = true;
      if (rental.isOverdue) existing.hasOverdue = true;
      existing.rentals.push(rental);
    } else {
      customerMap.set(key, {
        name: rental.namaPenyewa,
        phone: rental.noHp,
        address: rental.alamat,
        rentalCount: 1,
        totalSpent: rental.totalHarga,
        firstRentalDate: rental.createdAt,
        lastRentalDate: rental.createdAt,
        hasActive: rental.status === "aktif",
        hasOverdue: !!rental.isOverdue,
        rentals: [rental],
      });
    }
  }

  return Array.from(customerMap.values());
}

export function PelangganTab({ rentals }: { rentals: RentalWithItems[] }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "semua" | "aktif" | "kembali" | "terlambat"
  >("semua");
  const [sortBy, setSortBy] = useState<"terbaru" | "terbanyak" | "terlama">(
    "terbaru"
  );
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  const customers = useMemo(() => deriveCustomers(rentals), [rentals]);

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.hasActive).length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  const filteredCustomers = useMemo(() => {
    let result = customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.address.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        filterStatus === "semua" ||
        (filterStatus === "aktif" && c.hasActive) ||
        (filterStatus === "kembali" && !c.hasActive && !c.hasOverdue) ||
        (filterStatus === "terlambat" && c.hasOverdue);
      return matchSearch && matchStatus;
    });

    result.sort((a, b) => {
      if (sortBy === "terbaru") {
        return b.lastRentalDate.localeCompare(a.lastRentalDate);
      }
      if (sortBy === "terbanyak") {
        return b.totalSpent - a.totalSpent;
      }
      // terlama
      return a.firstRentalDate.localeCompare(b.firstRentalDate);
    });

    return result;
  }, [customers, search, filterStatus, sortBy]);

  const getCustomerStatusBadge = (customer: CustomerSummary) => {
    if (customer.hasOverdue) {
      return (
        <Badge className="bg-red-100 text-red-700 border-0 text-xs gap-1">
          Terlambat
        </Badge>
      );
    }
    if (customer.hasActive) {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs gap-1">
          Aktif
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-600 border-0 text-xs gap-1">
        Kembali
      </Badge>
    );
  };

  const toggleExpand = (key: string) => {
    setExpandedCustomer((prev) => (prev === key ? null : key));
  };

  if (rentals.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-fade-in-up">
          <h2 className="text-xl font-bold text-gray-900">Data Pelanggan</h2>
          <p className="text-sm text-gray-500 mt-1">
            Daftar pelanggan dari data penyewaan
          </p>
        </div>
        <Card className="border-0 shadow-md card-elevated">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 bg-emerald-50 rounded-2xl p-5 w-fit">
              <Users className="w-14 h-14 text-emerald-200" />
            </div>
            <p className="text-gray-500 text-sm font-medium">
              Belum ada data pelanggan
            </p>
            <p className="text-gray-400 text-xs mt-2 max-w-[280px] mx-auto">
              Data pelanggan akan muncul setelah ada transaksi penyewaan yang
              tercatat.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h2 className="text-xl font-bold text-gray-900">Data Pelanggan</h2>
        <p className="text-sm text-gray-500 mt-1">
          Daftar pelanggan dari data penyewaan
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md card-elevated animate-fade-in-up">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-blue-50 rounded-xl p-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">
                Total Pelanggan
              </p>
              <p className="text-2xl font-bold text-gray-900 stat-number">
                {totalCustomers}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md card-elevated animate-fade-in-up animate-fade-in-up-delay-1">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-emerald-50 rounded-xl p-3">
              <UserCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">
                Pelanggan Aktif
              </p>
              <p className="text-2xl font-bold text-emerald-700 stat-number">
                {activeCustomers}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md card-elevated animate-fade-in-up animate-fade-in-up-delay-2">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-amber-50 rounded-xl p-3">
              <Wallet className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">
                Total Pendapatan
              </p>
              <p className="text-2xl font-bold text-gray-900 stat-number">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3 animate-fade-in-up animate-fade-in-up-delay-3">
        <Input
          placeholder="Cari nama, no HP, alamat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="transition-all focus:ring-2 focus:ring-emerald-500/20"
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: "semua", label: "Semua" },
                { key: "aktif", label: "Aktif" },
                { key: "kembali", label: "Kembali" },
                { key: "terlambat", label: "Terlambat" },
              ] as const
            ).map((f) => (
              <Button
                key={f.key}
                variant={filterStatus === f.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(f.key)}
                className={
                  filterStatus === f.key
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : ""
                }
              >
                {f.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            {(
              [
                { key: "terbaru", label: "Terbaru" },
                { key: "terbanyak", label: "Terbanyak" },
                { key: "terlama", label: "Terlama" },
              ] as const
            ).map((s) => (
              <Button
                key={s.key}
                variant={sortBy === s.key ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy(s.key)}
                className={
                  sortBy === s.key
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : ""
                }
              >
                {s.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <Card className="border-0 shadow-md card-elevated animate-fade-in-up">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 bg-emerald-50 rounded-2xl p-5 w-fit">
              <Search className="w-14 h-14 text-emerald-200" />
            </div>
            <p className="text-gray-500 text-sm font-medium">
              Tidak ada pelanggan yang cocok
            </p>
            <p className="text-gray-400 text-xs mt-2 max-w-[280px] mx-auto">
              Coba ubah kata kunci pencarian atau filter untuk menemukan pelanggan
              yang Anda cari.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCustomers.map((customer, index) => {
            const customerKey = `${customer.name}::${customer.phone}`;
            const isExpanded = expandedCustomer === customerKey;

            return (
              <Card
                key={customerKey}
                className={`border-0 shadow-md card-elevated hover-lift animate-fade-in-up ${
                  customer.hasOverdue ? "border-l-4 border-l-red-500" : ""
                }`}
                style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
              >
                <CardContent className="p-0">
                  {/* Customer Header */}
                  <button
                    onClick={() => toggleExpand(customerKey)}
                    className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-900 truncate">
                          {customer.name}
                        </h4>
                        {getCustomerStatusBadge(customer)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </span>
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {customer.address}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-gray-400">
                          {customer.rentalCount} penyewaan
                        </p>
                        <p className="text-sm font-bold text-emerald-700">
                          {formatCurrency(customer.totalSpent)}
                        </p>
                      </div>
                      <div className="text-sm text-gray-400">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Mobile summary (visible on small screens) */}
                  <div className="sm:hidden px-4 pb-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        {customer.rentalCount} penyewaan
                      </span>
                      <span className="font-bold text-emerald-700">
                        {formatCurrency(customer.totalSpent)}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Rental History */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {/* Customer Info Detail */}
                      <div className="px-4 py-3 bg-gray-50/50">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {customer.phone}
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600 truncate">
                            <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            {customer.address}
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            Pertama: {formatDateShort(customer.firstRentalDate)}
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            Terakhir: {formatDateShort(customer.lastRentalDate)}
                          </div>
                        </div>
                      </div>

                      {/* Rental List */}
                      <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        <div className="divide-y divide-gray-50">
                          {customer.rentals.map((rental) => (
                            <div
                              key={rental.id}
                              className="px-4 py-3 hover:bg-gray-50/30 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">
                                    {formatDateShort(rental.tanggalSewa)} →{" "}
                                    {formatDateShort(rental.tanggalKembali)}
                                  </span>
                                  {rental.isOverdue && (
                                    <Badge className="bg-red-100 text-red-700 border-0 text-[10px] px-1.5 py-0 gap-0.5">
                                      Terlambat {rental.daysOverdue} hari
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    className={
                                      rental.status === "aktif"
                                        ? "status-disewa text-[10px]"
                                        : "bg-emerald-100 text-emerald-700 text-[10px]"
                                    }
                                  >
                                    {rental.status === "aktif"
                                      ? "Disewa"
                                      : "Kembali"}
                                  </Badge>
                                  <span className="text-sm font-bold text-emerald-700">
                                    {formatCurrency(rental.totalHarga)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {rental.items.map((item) => (
                                  <span
                                    key={item.id}
                                    className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 rounded-md px-2 py-0.5"
                                  >
                                    <Package className="w-2.5 h-2.5" />
                                    {item.label} ×{item.jumlah}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
