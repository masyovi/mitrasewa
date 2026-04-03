"use client";

import { useState } from "react";
import {
  Download,
  RotateCcw,
  Trash2,
  RefreshCw,
  Printer,
  AlertTriangle,
  Search,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  type RentalWithItems,
} from "@/lib/types";
import { formatCurrency, formatDateShort } from "./helpers";

export function HistoryTab({
  rentals,
  onRefresh,
  onExport,
}: {
  rentals: RentalWithItems[];
  onRefresh: () => void;
  onExport: () => void;
}) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "semua" | "aktif" | "kembali"
  >("semua");

  const filteredRentals = rentals.filter((r) => {
    const matchSearch =
      r.namaPenyewa.toLowerCase().includes(search.toLowerCase()) ||
      r.noHp.includes(search) ||
      r.alamat.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "semua" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleReturn = async (id: string, nama: string) => {
    try {
      const res = await fetch("/api/rentals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "kembali" }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Berhasil",
          description: `Barang dari ${nama} telah dikembalikan`,
        });
        onRefresh();
      } else {
        toast({
          title: "Gagal",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Gagal mengupdate status",
        variant: "destructive",
      });
    }
  };

  const handlePrint = async (rental: RentalWithItems) => {
    try {
      const res = await fetch(`/api/receipt?id=${rental.id}`);
      const data = await res.json();
      if (!data.success) {
        toast({ title: "Gagal", description: data.message, variant: "destructive" });
        return;
      }
      const r = data.data;
      const itemsHtml = r.items.map((item: { label: string; jumlah: number; harga: number; billingType: string; multiplier: number; subtotal: number }) => `
        <tr>
          <td style="padding:6px 0;border-bottom:1px dashed #e5e7eb">${item.label}</td>
          <td style="padding:6px 8px;border-bottom:1px dashed #e5e7eb;text-align:center">${item.jumlah}</td>
          <td style="padding:6px 8px;border-bottom:1px dashed #e5e7eb;text-align:right">${formatCurrency(item.harga)}</td>
          <td style="padding:6px 8px;border-bottom:1px dashed #e5e7eb;text-align:center">${item.billingType === "bulanan" ? item.multiplier + " bln" : item.multiplier + " hr"}</td>
          <td style="padding:6px 8px;border-bottom:1px dashed #e5e7eb;text-align:right;font-weight:600">${formatCurrency(item.subtotal)}</td>
        </tr>
      `).join("");

      const printHtml = `<!DOCTYPE html>
<html><head><title>Nota Sewa - ${r.namaPenyewa}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:20px;color:#111}
  .receipt{max-width:400px;margin:0 auto}
  .header{text-align:center;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #059669}
  .header h1{font-size:20px;margin:0 0 2px;color:#059669}
  .header p{font-size:11px;color:#6b7280;margin:0}
  .info{margin-bottom:12px;font-size:13px}
  .info p{margin:3px 0}
  .info strong{color:#111}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{text-align:left;padding:6px 8px;border-bottom:2px solid #059669;color:#059669;font-size:11px;text-transform:uppercase}
  .total{text-align:right;font-size:16px;font-weight:700;padding:12px 8px 0;color:#059669;border-top:2px solid #e5e7eb;margin-top:8px}
  .footer{text-align:center;margin-top:16px;padding-top:12px;border-top:1px dashed #e5e7eb;font-size:10px;color:#9ca3af}
  @media print{body{padding:0}}
</style></head><body>
<div class="receipt">
  <div class="header">
    <h1>MITRA SEWA</h1>
    <p>Penyewaan Alat Konstruksi Terpercaya</p>
  </div>
  <div class="info">
    <p><strong>Nama:</strong> ${r.namaPenyewa}</p>
    <p><strong>No HP:</strong> ${r.noHp}</p>
    <p><strong>Alamat:</strong> ${r.alamat}</p>
    <p><strong>Tanggal:</strong> ${formatDateShort(r.tanggalSewa)} → ${formatDateShort(r.tanggalKembali)}</p>
    <p><strong>Durasi:</strong> ${r.lamaSewa} hari</p>
  </div>
  <table>
    <thead><tr><th>Barang</th><th>Qty</th><th>Harga</th><th>Durasi</th><th>Subtotal</th></tr></thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <div class="total">Total: ${formatCurrency(r.totalHarga)}</div>
  <div class="footer">
    <p>Dibuat: ${formatDateShort(r.createdAt)}</p>
    <p>&copy; ${new Date().getFullYear()} MITRA SEWA</p>
    <p>Didukung oleh Pengelola Gedung Pusat BMT NU Ngasem Group</p>
  </div>
</div></body></html>`;

      const printWindow = window.open("", "_blank", "width=450,height=700");
      if (printWindow) {
        printWindow.document.write(printHtml);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 500);
      }
    } catch {
      toast({ title: "Error", description: "Gagal mencetak nota", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/rentals?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Berhasil", description: "Data berhasil dihapus" });
        onRefresh();
      } else {
        toast({
          title: "Gagal",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Gagal menghapus data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in-up">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            History Penyewaan
          </h2>
          <p className="text-sm text-gray-500">
            {filteredRentals.length} data penyewaan
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={onExport}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up animate-fade-in-up-delay-1">
        <Input
          placeholder="Cari nama, no HP, alamat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 transition-all focus:ring-2 focus:ring-emerald-500/20"
        />
        <div className="flex gap-2">
          {(["semua", "aktif", "kembali"] as const).map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className={
                filterStatus === status
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : ""
              }
            >
              {status === "semua"
                ? "Semua"
                : status === "aktif"
                  ? "Disewa"
                  : "Kembali"}
            </Button>
          ))}
        </div>
      </div>

      {filteredRentals.length === 0 ? (
        <Card className="border-0 shadow-md card-elevated">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 bg-emerald-50 rounded-2xl p-5 w-fit">
              {search || filterStatus !== "semua" ? (
                <Search className="w-14 h-14 text-emerald-200" />
              ) : (
                <ClipboardList className="w-14 h-14 text-emerald-200" />
              )}
            </div>
            <p className="text-gray-500 text-sm font-medium">
              {search || filterStatus !== "semua"
                ? "Tidak ada data yang cocok"
                : "Belum ada data penyewaan"}
            </p>
            {(search || filterStatus !== "semua") && (
              <p className="text-gray-400 text-xs mt-2 max-w-[280px] mx-auto">
                Coba ubah kata kunci pencarian atau filter status untuk menemukan data yang Anda cari.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRentals.map((rental) => (
            <Card key={rental.id} className={`border-0 shadow-md overflow-hidden card-elevated animate-bounce-in ${rental.isOverdue ? "border-l-4 border-l-red-500" : ""}`}>
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4 pb-3 border-b border-gray-50">
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {rental.namaPenyewa}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {rental.noHp}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {rental.alamat}
                      </span>
                      {rental.isOverdue && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <Badge className="bg-red-100 text-red-700 border-0 text-[11px] px-1.5 py-0 gap-1 badge-glow-red">
                            <AlertTriangle className="w-3 h-3" />
                            Terlambat {rental.daysOverdue} hari
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {rental.isOverdue && (
                      <Badge className="bg-red-500 text-white border-0 animate-pulse badge-glow-red">
                        Terlambat
                      </Badge>
                    )}
                    <Badge
                      className={
                        rental.status === "aktif"
                          ? "status-disewa"
                          : "bg-emerald-100 text-emerald-700"
                      }
                    >
                      {rental.status === "aktif" ? "Disewa" : "Kembali"}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 pb-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-500 border-b border-gray-100">
                          <th className="text-left py-1.5 font-medium">Barang</th>
                          <th className="text-center py-1.5 font-medium">Qty</th>
                          <th className="text-right py-1.5 font-medium hidden sm:table-cell">
                            Harga
                          </th>
                          <th className="text-center py-1.5 font-medium hidden sm:table-cell">
                            Durasi
                          </th>
                          <th className="text-right py-1.5 font-medium">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rental.items.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-gray-50 last:border-0"
                          >
                            <td className="py-2">{item.label}</td>
                            <td className="text-center py-2">
                              {item.jumlah}
                            </td>
                            <td className="text-right py-2 hidden sm:table-cell text-gray-500">
                              <div>{formatCurrency(item.harga)}</div>
                              <div className="text-[10px] text-gray-400">
                                /{item.billingType === "bulanan" ? "bulan" : "hari"}
                              </div>
                            </td>
                            <td className="text-center py-2 hidden sm:table-cell text-xs text-gray-500">
                              {item.billingType === "bulanan"
                                ? `${item.multiplier} bln`
                                : `${item.multiplier} hr`}
                            </td>
                            <td className="text-right py-2 font-medium">
                              {formatCurrency(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 pt-2 gap-3 bg-gray-50/50">
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <p>
                      Sewa:{" "}
                      {formatDateShort(rental.tanggalSewa)} →{" "}
                      {formatDateShort(rental.tanggalKembali)} ({rental.lamaSewa}{" "}
                      hari)
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Dibuat: {formatDateShort(rental.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400">Total</p>
                      <p className="font-bold text-emerald-700 text-sm">
                        {formatCurrency(rental.totalHarga)}
                      </p>
                    </div>
                    {rental.status === "aktif" && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Kembali
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Konfirmasi Pengembalian</DialogTitle>
                          </DialogHeader>
                          <p className="text-sm text-gray-600">
                            Apakah barang dari <strong>{rental.namaPenyewa}</strong>{" "}
                            sudah dikembalikan?
                          </p>
                          <DialogFooter className="gap-2">
                            <DialogClose asChild>
                              <Button variant="outline" size="sm">
                                Batal
                              </Button>
                            </DialogClose>
                            <DialogClose asChild>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={() =>
                                  handleReturn(rental.id, rental.namaPenyewa)
                                }
                              >
                                Ya, Kembalikan
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs h-8 border-gray-200 text-gray-600 hover:bg-gray-50"
                      onClick={() => handlePrint(rental)}
                    >
                      <Printer className="w-3 h-3" />
                      <span className="hidden sm:inline">Cetak</span>
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-xs h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Hapus Data</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-gray-600">
                          Yakin ingin menghapus data penyewaan{" "}
                          <strong>{rental.namaPenyewa}</strong>? Tindakan ini
                          tidak dapat dibatalkan.
                        </p>
                        <DialogFooter className="gap-2">
                          <DialogClose asChild>
                            <Button variant="outline" size="sm">
                              Batal
                            </Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(rental.id)}
                            >
                              Hapus
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
