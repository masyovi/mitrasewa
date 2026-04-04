"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Package,
  Settings,
  HardHat,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  type StockData,
  type PriceData,
  type RentalWithItems,
} from "@/lib/types";
import { useMemoLamaSewa, formatCurrency } from "./helpers";

export function InputSewaTab({
  priceData,
  stockData,
  rentals,
  onSuccess,
}: {
  priceData: PriceData[];
  stockData: StockData[];
  rentals: RentalWithItems[];
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [namaPenyewa, setNamaPenyewa] = useState("");
  const [noHp, setNoHp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [tanggalSewa, setTanggalSewa] = useState("");
  const [tanggalKembali, setTanggalKembali] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownFilter, setDropdownFilter] = useState("");

  // Build unique customer list from previous rentals (most recent first)
  const customerList = useMemo(() => {
    const seen = new Set<string>();
    const list: { nama: string; noHp: string; alamat: string }[] = [];
    for (const r of rentals) {
      const key = r.namaPenyewa.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ nama: r.namaPenyewa, noHp: r.noHp, alamat: r.alamat });
      }
    }
    return list;
  }, [rentals]);

  const filteredCustomers = useMemo(() => {
    if (!dropdownFilter) return customerList.slice(0, 8);
    const f = dropdownFilter.toLowerCase();
    return customerList.filter((c) => c.nama.toLowerCase().includes(f)).slice(0, 8);
  }, [customerList, dropdownFilter]);

  const handleSelectCustomer = (customer: { nama: string; noHp: string; alamat: string }) => {
    setNamaPenyewa(customer.nama);
    setNoHp(customer.noHp);
    setAlamat(customer.alamat);
    setShowDropdown(false);
    setDropdownFilter("");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-customer-dropdown]')) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const [itemQuantities, setItemQuantities] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    const init: Record<string, number> = {};
    priceData.forEach((p) => {
      init[p.item] = 0;
    });
    setItemQuantities(init);
  }, [priceData]);

  const lamaSewa = useMemoLamaSewa(tanggalSewa, tanggalKembali);

  const { subtotals, multipliers, totalHarga, selectedItemDetails } = useMemo(() => {
    const st: Record<string, number> = {};
    const ml: Record<string, { value: number; label: string }> = {};
    let total = 0;
    const selected: { item: string; label: string; qty: number; harga: number; multiplier: number; multiplierLabel: string; billingType: string; unit: string; subtotal: number }[] = [];

    priceData.forEach((p) => {
      const qty = itemQuantities[p.item] || 0;
      let multiplier: number;
      let label: string;
      if (p.billingType === "bulanan") {
        multiplier = lamaSewa > 0 ? Math.max(1, Math.ceil(lamaSewa / 30)) : 0;
        label = multiplier > 0 ? `${multiplier} bulan` : "-";
      } else {
        multiplier = lamaSewa;
        label = lamaSewa > 0 ? `${lamaSewa} hari` : "-";
      }
      const sub = qty * p.price * multiplier;
      st[p.item] = sub;
      ml[p.item] = { value: multiplier, label };
      total += sub;

      if (qty > 0) {
        selected.push({
          item: p.item,
          label: p.label,
          qty,
          harga: p.price,
          multiplier,
          multiplierLabel: label,
          billingType: p.billingType,
          unit: p.unit,
          subtotal: sub,
        });
      }
    });
    return { subtotals: st, multipliers: ml, totalHarga: total, selectedItemDetails: selected };
  }, [priceData, itemQuantities, lamaSewa]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tanggalSewa || !tanggalKembali) {
      toast({ title: "Error", description: "Tanggal harus diisi", variant: "destructive" });
      return;
    }

    const hasItem = Object.values(itemQuantities).some((q) => q > 0);
    if (!hasItem) {
      toast({
        title: "Error",
        description: "Pilih minimal satu barang untuk disewa",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const items = priceData
        .filter((p) => (itemQuantities[p.item] || 0) > 0)
        .map((p) => ({
          item: p.item,
          label: p.label,
          jumlah: itemQuantities[p.item],
          harga: p.price,
          billingType: p.billingType,
        }));

      const res = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaPenyewa,
          noHp,
          alamat,
          tanggalSewa,
          tanggalKembali,
          items,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: "Berhasil!",
          description: `Penyewaan ${namaPenyewa} berhasil disimpan`,
        });
        setNamaPenyewa("");
        setNoHp("");
        setAlamat("");
        setTanggalSewa("");
        setTanggalKembali("");
        const init: Record<string, number> = {};
        priceData.forEach((p) => {
          init[p.item] = 0;
        });
        setItemQuantities(init);
        onSuccess();
      } else {
        toast({
          title: "Gagal",
          description: data.message || "Terjadi kesalahan",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Gagal menyimpan data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvailable = (itemKey: string): number => {
    const stock = stockData.find((s) => s.item === itemKey);
    return stock?.tersedia ?? 0;
  };

  const getPerbaikan = (itemKey: string): number => {
    const stock = stockData.find((s) => s.item === itemKey);
    return stock?.perbaikan ?? 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Input Penyewaan</h2>
        <p className="text-sm text-gray-500">
          Tambahkan data penyewaan baru
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              Data Penyewa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 relative" data-customer-dropdown>
                <Label htmlFor="nama" className="text-sm">
                  Nama Penyewa <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nama"
                  placeholder="Nama lengkap penyewa"
                  value={namaPenyewa}
                  onChange={(e) => {
                    setNamaPenyewa(e.target.value);
                    setDropdownFilter(e.target.value);
                  }}
                  onFocus={() => {
                    setDropdownFilter(namaPenyewa);
                    setShowDropdown(true);
                  }}
                  required
                />
                {showDropdown && filteredCustomers.length > 0 && !namaPenyewa && (
                  <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                      Pelanggan sebelumnya
                    </div>
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer.nama}
                        type="button"
                        className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 transition-colors flex items-center justify-between gap-2 border-b border-gray-50 last:border-0"
                        onClick={() => handleSelectCustomer(customer)}
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{customer.nama}</p>
                          <p className="text-xs text-gray-400 truncate">{customer.noHp} • {customer.alamat}</p>
                        </div>
                        <Receipt className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && filteredCustomers.length > 0 && namaPenyewa && filteredCustomers.some((c) => c.nama.toLowerCase().includes(namaPenyewa.toLowerCase())) && (
                  <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                      Cocok dengan pelanggan sebelumnya
                    </div>
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer.nama}
                        type="button"
                        className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 transition-colors flex items-center justify-between gap-2 border-b border-gray-50 last:border-0"
                        onClick={() => handleSelectCustomer(customer)}
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{customer.nama}</p>
                          <p className="text-xs text-gray-400 truncate">{customer.noHp} • {customer.alamat}</p>
                        </div>
                        <Receipt className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nohp" className="text-sm">
                  No HP <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nohp"
                  placeholder="08xxxxxxxxxx"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alamat" className="text-sm">
                Alamat <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="alamat"
                placeholder="Alamat pengambilan / lokasi proyek"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                rows={2}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-600" />
              Tanggal Sewa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tgl-sewa" className="text-sm">
                  Tanggal Sewa <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tgl-sewa"
                  type="date"
                  value={tanggalSewa}
                  onChange={(e) => setTanggalSewa(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tgl-kembali" className="text-sm">
                  Tanggal Kembali <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tgl-kembali"
                  type="date"
                  value={tanggalKembali}
                  min={tanggalSewa}
                  onChange={(e) => setTanggalKembali(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Lama Sewa</Label>
                <div className="flex items-center h-10 px-3 rounded-md border border-gray-200 bg-gray-50">
                  <span className="font-bold text-emerald-700">
                    {lamaSewa > 0 ? `${lamaSewa} hari` : "-"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <HardHat className="w-4 h-4 text-emerald-600" />
              Pilih Barang
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {priceData.map((price) => {
              const qty = itemQuantities[price.item] || 0;
              const available = getAvailable(price.item);
              const perbaikan = getPerbaikan(price.item);
              const subtotal = subtotals[price.item] || 0;
              const isPerbaikan = perbaikan > 0;
              const isUnavailable = available <= 0 && perbaikan <= 0;

              return (
                <div
                  key={price.item}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border bg-white ${
                    isPerbaikan
                      ? "border-orange-200 bg-orange-50/30"
                      : isUnavailable
                      ? "border-red-100 bg-red-50/30 opacity-60"
                      : "border-gray-100"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-gray-900">
                        {price.label}
                      </p>
                      {isPerbaikan && (
                        <Badge className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0 h-5 border-0">
                          <AlertTriangle className="w-3 h-3 mr-0.5" />
                          {perbaikan} perbaikan
                        </Badge>
                      )}
                      {isUnavailable && (
                        <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0 h-5 border-0">
                          Habis
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        Rp {price.price.toLocaleString("id-ID")} / {price.billingType === "bulanan" ? "bulan" : "hari"}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-gray-200 text-gray-500">
                        {price.billingType === "bulanan" ? "Per Bulan" : "Per Hari"}
                      </Badge>
                      <span
                        className={`text-xs ${
                          available > 0
                            ? "text-emerald-600"
                            : "text-red-500"
                        }`}
                      >
                        Stok tersedia: {available} {price.unit}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setItemQuantities((prev) => ({
                            ...prev,
                            [price.item]: Math.max(0, (prev[price.item] || 0) - 1),
                          }))
                        }
                        disabled={available <= 0}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                      >
                        -
                      </button>
                      <Input
                        type="number"
                        min={0}
                        max={available}
                        value={qty}
                        onChange={(e) =>
                          setItemQuantities((prev) => ({
                            ...prev,
                            [price.item]: Math.min(
                              available,
                              Math.max(0, parseInt(e.target.value) || 0)
                            ),
                          }))
                        }
                        className="w-16 h-8 text-center text-sm"
                        disabled={available <= 0}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setItemQuantities((prev) => ({
                            ...prev,
                            [price.item]: Math.min(
                              available,
                              (prev[price.item] || 0) + 1
                            ),
                          }))
                        }
                        disabled={available <= qty}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    {qty > 0 && (
                      <div className="text-right min-w-[120px]">
                        <p className="text-xs text-gray-400">
                          {multipliers[price.item]?.label} ({lamaSewa} hari)
                        </p>
                        <p className="font-bold text-sm text-emerald-700">
                          {formatCurrency(subtotal)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {selectedItemDetails.length > 0 && (
          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-white border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Rincian Tagihan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-emerald-100">
                <Settings className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <div className="text-sm">
                  <span className="text-gray-500">Periode sewa: </span>
                  <span className="font-semibold text-gray-900">{lamaSewa} hari</span>
                  {lamaSewa > 30 && (
                    <span className="text-xs text-gray-400 ml-1">
                      (bulanan dihitung per 30 hari)
                    </span>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                {selectedItemDetails.map((item, idx) => (
                  <div key={item.item} className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {item.label}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 ml-7 mt-0.5">
                        {item.qty} {item.unit} × Rp {item.harga.toLocaleString("id-ID")} / {item.billingType === "bulanan" ? "bulan" : "hari"} × {item.multiplierLabel}
                      </p>
                    </div>
                    <p className="font-semibold text-sm text-gray-900 whitespace-nowrap">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex items-center justify-between bg-emerald-600 text-white rounded-lg p-4">
                <div>
                  <p className="text-sm text-emerald-100">Total Tagihan</p>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    {selectedItemDetails.length} jenis alat • {lamaSewa} hari sewa
                  </p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">
                  {formatCurrency(totalHarga)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 text-base"
          disabled={loading || selectedItemDetails.length === 0}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              Menyimpan...
            </span>
          ) : (
            `Simpan Penyewaan ${totalHarga > 0 ? `- ${formatCurrency(totalHarga)}` : ""}`
          )}
        </Button>
      </form>
    </div>
  );
}
