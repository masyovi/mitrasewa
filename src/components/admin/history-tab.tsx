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
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Repeat2,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  type RentalExtension,
} from "@/lib/types";
import { formatCurrency, formatDateShort } from "./helpers";

// Helper: format Date to YYYY-MM-DD for input[type="date"]
function toDateString(date: string | Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Helper: format Date to readable indonesian date
function toReadableDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Helper: calculate days between two dates
function daysBetween(from: Date, to: Date): number {
  const diffTime = to.getTime() - from.getTime();
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

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

  // Extend dialog state
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [extendRental, setExtendRental] = useState<RentalWithItems | null>(null);
  const [extendDate, setExtendDate] = useState("");
  const [extendLoading, setExtendLoading] = useState(false);

  // Edit extension dialog state
  const [editExtDialogOpen, setEditExtDialogOpen] = useState(false);
  const [editExtRental, setEditExtRental] = useState<RentalWithItems | null>(null);
  const [editExtId, setEditExtId] = useState<string>("");
  const [editExtDate, setEditExtDate] = useState("");
  const [editExtLoading, setEditExtLoading] = useState(false);

  // Expanded extension history per card
  const [expandedExtensions, setExpandedExtensions] = useState<Set<string>>(new Set());

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

  const openExtendDialog = (rental: RentalWithItems) => {
    setExtendRental(rental);
    // Default: 7 days from today
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setExtendDate(toDateString(defaultDate));
    setExtendDialogOpen(true);
  };

  const handleExtend = async () => {
    if (!extendRental || !extendDate) return;

    setExtendLoading(true);
    try {
      const res = await fetch("/api/rentals/extend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: extendRental.id,
          newTanggalKembali: extendDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Sewa Berhasil Diperpanjang",
          description: `Tagihan perpanjangan: ${formatCurrency(data.data.extensionTotal)}`,
        });
        setExtendDialogOpen(false);
        setExtendRental(null);
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
        description: "Gagal memperpanjang sewa",
        variant: "destructive",
      });
    } finally {
      setExtendLoading(false);
    }
  };

  // Open edit extension dialog
  const openEditExtDialog = (rental: RentalWithItems, ext: RentalExtension) => {
    setEditExtRental(rental);
    setEditExtId(ext.id);
    setEditExtDate(toDateString(ext.newTanggalKembali));
    setEditExtDialogOpen(true);
  };

  // Save edited extension
  const handleEditExtension = async () => {
    if (!editExtId || !editExtDate) return;

    setEditExtLoading(true);
    try {
      const res = await fetch("/api/rentals/extend", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extensionId: editExtId,
          newTanggalKembali: editExtDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Tanggal Berhasil Diubah",
          description: `Jatuh tempo baru: ${toReadableDate(editExtDate)}`,
        });
        setEditExtDialogOpen(false);
        setEditExtRental(null);
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
        description: "Gagal mengubah tanggal perpanjangan",
        variant: "destructive",
      });
    } finally {
      setEditExtLoading(false);
    }
  };

  // Calculate extension total: days from day AFTER current tanggalKembali to new date
  const getEstimatedExtensionTotal = () => {
    if (!extendRental || !extendDate) return null;

    const selectedDate = new Date(extendDate);
    const currentKembali = new Date(extendRental.tanggalKembali);
    currentKembali.setHours(0, 0, 0, 0);

    const startDate = new Date(currentKembali);
    startDate.setDate(startDate.getDate() + 1);
    const additionalDays = Math.max(1, daysBetween(startDate, selectedDate));

    let total = 0;
    for (const item of extendRental.items) {
      let multiplier = additionalDays;
      if (item.billingType === "bulanan") {
        multiplier = Math.max(1, Math.ceil(additionalDays / 30));
      }
      total += item.jumlah * item.harga * multiplier;
    }
    return { total, days: additionalDays };
  };

  // Helper: compute total extension cost and grand total for a rental
  const getExtensionSummary = (rental: RentalWithItems) => {
    const extTotal = (rental.extensions || []).reduce((sum, ext) => sum + ext.extensionTotal, 0);
    const grandTotal = rental.totalHarga + extTotal;
    return { extTotal, grandTotal, count: rental.extensions?.length || 0 };
  };

  const toggleExtensionHistory = (rentalId: string) => {
    setExpandedExtensions((prev) => {
      const next = new Set(prev);
      if (next.has(rentalId)) {
        next.delete(rentalId);
      } else {
        next.add(rentalId);
      }
      return next;
    });
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
      const summary = getExtensionSummary(rental);

      const itemsHtml = r.items.map((item: { label: string; jumlah: number; harga: number; billingType: string; multiplier: number; subtotal: number }) => `
        <tr>
          <td style="padding:6px 0;border-bottom:1px dashed #e5e7eb">${item.label}</td>
          <td style="padding:6px 8px;border-bottom:1px dashed #e5e7eb;text-align:center">${item.jumlah}</td>
          <td style="padding:6px 8px;border-bottom:1px dashed #e5e7eb;text-align:right">${formatCurrency(item.harga)}</td>
          <td style="padding:6px 8px;border-bottom:1px dashed #e5e7eb;text-align:center">${item.billingType === "bulanan" ? item.multiplier + " bln" : item.multiplier + " hr"}</td>
          <td style="padding:6px 8px;border-bottom:1px dashed #e5e7eb;text-align:right;font-weight:600">${formatCurrency(item.subtotal)}</td>
        </tr>
      `).join("");

      // Build extension history for receipt
      let extensionHtml = "";
      if (summary.count > 0) {
        const extRows = rental.extensions.map((ext: RentalExtension) => `
          <tr>
            <td style="padding:4px 0;border-bottom:1px dashed #f3f4f6;font-size:11px">${formatDateShort(ext.createdAt)}</td>
            <td style="padding:4px 8px;border-bottom:1px dashed #f3f4f6;text-align:center;font-size:11px">${ext.extensionDays} hari</td>
            <td style="padding:4px 8px;border-bottom:1px dashed #f3f4f6;text-align:right;font-size:11px">${formatDateShort(ext.newTanggalKembali)}</td>
            <td style="padding:4px 8px;border-bottom:1px dashed #f3f4f6;text-align:right;font-size:11px;font-weight:600;color:#059669">${formatCurrency(ext.extensionTotal)}</td>
          </tr>
        `).join("");

        extensionHtml = `
          <div style="margin-top:12px;padding-top:10px;border-top:2px solid #f59e0b">
            <p style="font-size:12px;font-weight:700;color:#92400e;margin:0 0 6px">📋 Riwayat Perpanjangan</p>
            <table style="width:100%;border-collapse:collapse">
              <thead><tr>
                <th style="text-align:left;padding:4px 0;font-size:10px;color:#92400e;text-transform:uppercase">Tanggal</th>
                <th style="text-align:center;padding:4px 8px;font-size:10px;color:#92400e;text-transform:uppercase">Durasi</th>
                <th style="text-align:right;padding:4px 8px;font-size:10px;color:#92400e;text-transform:uppercase">Jatuh Tempo</th>
                <th style="text-align:right;padding:4px 8px;font-size:10px;color:#92400e;text-transform:uppercase">Tagihan</th>
              </tr></thead>
              <tbody>${extRows}</tbody>
            </table>
            <div style="text-align:right;margin-top:6px;font-size:12px;font-weight:700;color:#92400e">
              Total Perpanjangan: ${formatCurrency(summary.extTotal)}
            </div>
          </div>
        `;
      }

      const grandTotalHtml = summary.count > 0
        ? `<div style="text-align:right;font-size:18px;font-weight:700;padding:10px 8px 0;color:#059669;border-top:2px solid #e5e7eb;margin-top:8px">
            Total Keseluruhan: ${formatCurrency(summary.grandTotal)}
            <div style="font-size:10px;font-weight:400;color:#6b7280;margin-top:2px">
              (Awal ${formatCurrency(r.totalHarga)} + Perpanjangan ${formatCurrency(summary.extTotal)})
            </div>
          </div>`
        : `<div class="total">Total: ${formatCurrency(r.totalHarga)}</div>`;

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
    <p><strong>Tanggal:</strong> ${formatDateShort(r.tanggalSewa)} → ${formatDateShort(r.tanggalKembali)} (${r.lamaSewa} hari)</p>
  </div>
  <table>
    <thead><tr><th>Barang</th><th>Qty</th><th>Harga</th><th>Durasi</th><th>Subtotal</th></tr></thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  ${extensionHtml}
  ${grandTotalHtml}
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

  // Quick-select date presets (days from today)
  const datePresets = [
    { label: "7 hari", days: 7 },
    { label: "14 hari", days: 14 },
    { label: "30 hari", days: 30 },
    { label: "60 hari", days: 60 },
    { label: "90 hari", days: 90 },
  ];

  const getPresetDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return toDateString(d);
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
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 btn-emerald-gradient"
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
                  ? "bg-emerald-600 hover:bg-emerald-700 btn-emerald-gradient"
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
          {filteredRentals.map((rental) => {
            const summary = getExtensionSummary(rental);
            const hasExtensions = summary.count > 0;
            const isExpanded = expandedExtensions.has(rental.id);

            return (
              <Card key={rental.id} className={`border-0 shadow-md overflow-hidden card-elevated animate-bounce-in ${rental.isOverdue ? "border-l-4 border-l-red-500" : ""}`}>
                <CardContent className="p-0">
                  {/* Header row */}
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
                        {hasExtensions && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <Badge className="bg-amber-100 text-amber-700 border-0 text-[11px] px-1.5 py-0 gap-1">
                              <Repeat2 className="w-3 h-3" />
                              {summary.count}x perpanjangan
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

                  {/* Items table */}
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

                  {/* Extension history (collapsible) */}
                  {hasExtensions && (
                    <div className="px-4 pb-1">
                      <button
                        onClick={() => toggleExtensionHistory(rental.id)}
                        className="flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-800 font-medium transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                        Riwayat Perpanjangan ({summary.count})
                      </button>
                      {isExpanded && (
                        <div className="mt-2 mb-2 bg-amber-50 border border-amber-200 rounded-lg overflow-hidden animate-fade-in-up">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-amber-700 border-b border-amber-200 bg-amber-100/50">
                                <th className="text-left px-3 py-2 font-medium">Tanggal</th>
                                <th className="text-center px-3 py-2 font-medium">Durasi</th>
                                <th className="text-right px-3 py-2 font-medium">Jatuh Tempo Baru</th>
                                <th className="text-right px-3 py-2 font-medium">Tagihan</th>
                                {rental.status === "aktif" && (
                                  <th className="text-center px-2 py-2 font-medium">Aksi</th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {rental.extensions.map((ext) => (
                                <tr key={ext.id} className="border-b border-amber-100 last:border-0 group">
                                  <td className="px-3 py-2 text-gray-600">{formatDateShort(ext.createdAt)}</td>
                                  <td className="px-3 py-2 text-center text-gray-600">{ext.extensionDays} hari</td>
                                  <td className="px-3 py-2 text-right text-gray-600">{formatDateShort(ext.newTanggalKembali)}</td>
                                  <td className="px-3 py-2 text-right font-semibold text-amber-700">{formatCurrency(ext.extensionTotal)}</td>
                                  {rental.status === "aktif" && (
                                    <td className="px-2 py-2 text-center">
                                      <button
                                        onClick={() => openEditExtDialog(rental, ext)}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors opacity-60 group-hover:opacity-100"
                                        title="Ubah tanggal"
                                      >
                                        <Pencil className="w-3 h-3" />
                                        <span className="hidden sm:inline">Ubah</span>
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer: dates + totals + actions */}
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
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Perpanjang Sewa button — only for active rentals */}
                      {rental.status === "aktif" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className={`gap-1 text-xs h-8 font-medium ${rental.isOverdue ? "border-amber-300 text-amber-700 hover:bg-amber-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}
                          onClick={() => openExtendDialog(rental)}
                        >
                          <CalendarClock className="w-3 h-3" />
                          Perpanjang
                        </Button>
                      )}

                      {/* Separate billing display */}
                      <div className="text-right">
                        {!hasExtensions ? (
                          <>
                            <p className="text-[10px] text-gray-400">Total</p>
                            <p className="font-bold text-emerald-700 text-sm">
                              {formatCurrency(rental.totalHarga)}
                            </p>
                          </>
                        ) : (
                          <div className="space-y-0.5">
                            <div>
                              <p className="text-[10px] text-gray-400">Tagihan Awal</p>
                              <p className="font-semibold text-gray-700 text-xs">
                                {formatCurrency(rental.totalHarga)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-amber-600">Perpanjangan ({summary.count}x)</p>
                              <p className="font-semibold text-amber-700 text-xs">
                                +{formatCurrency(summary.extTotal)}
                              </p>
                            </div>
                            <div className="pt-0.5 border-t border-gray-200">
                              <p className="text-[10px] text-emerald-600">Total Keseluruhan</p>
                              <p className="font-bold text-emerald-700 text-sm">
                                {formatCurrency(summary.grandTotal)}
                              </p>
                            </div>
                          </div>
                        )}
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
                          <DialogContent aria-describedby={undefined}>
                            <DialogHeader>
                              <DialogTitle>Konfirmasi Pengembalian</DialogTitle>
                            </DialogHeader>
                            <p className="text-sm text-gray-600">
                              Apakah barang dari <strong>{rental.namaPenyewa}</strong>{" "}
                              sudah dikembalikan?
                            </p>
                            {hasExtensions && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs space-y-1">
                                <p className="font-semibold text-amber-800">Ringkasan Tagihan:</p>
                                <div className="flex justify-between text-amber-700">
                                  <span>Tagihan Awal</span>
                                  <span className="font-medium">{formatCurrency(rental.totalHarga)}</span>
                                </div>
                                <div className="flex justify-between text-amber-700">
                                  <span>Total Perpanjangan ({summary.count}x)</span>
                                  <span className="font-medium">+{formatCurrency(summary.extTotal)}</span>
                                </div>
                                <div className="flex justify-between text-amber-900 font-bold border-t border-amber-300 pt-1">
                                  <span>Total Keseluruhan</span>
                                  <span>{formatCurrency(summary.grandTotal)}</span>
                                </div>
                              </div>
                            )}
                            <DialogFooter className="gap-2">
                              <DialogClose asChild>
                                <Button variant="outline" size="sm">
                                  Batal
                                </Button>
                              </DialogClose>
                              <DialogClose asChild>
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 btn-emerald-gradient"
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
                        <DialogContent aria-describedby={undefined}>
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
            );
          })}
        </div>
      )}

      {/* ===== Perpanjang Sewa Dialog ===== */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="bg-amber-100 p-2 rounded-lg">
                <CalendarClock className="w-5 h-5 text-amber-700" />
              </div>
              Perpanjang Sewa
            </DialogTitle>
          </DialogHeader>

          {extendRental && (
            <div className="space-y-4">
              {/* Warning info (only if overdue) */}
              {extendRental.isOverdue && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-red-700">
                    <p className="font-semibold">Penyewaan Terlambat</p>
                    <p className="mt-0.5 text-red-600">
                      <strong>{extendRental.namaPenyewa}</strong> — Terlambat{" "}
                      {extendRental.daysOverdue} hari dari batas pengembalian (
                      {formatDateShort(extendRental.tanggalKembali)})
                    </p>
                  </div>
                </div>
              )}

              {/* Current info */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                <p className="text-xs text-gray-500">Informasi Sewa Saat Ini</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tanggal Sewa</span>
                  <span className="font-medium text-gray-900">{formatDateShort(extendRental.tanggalSewa)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Jatuh Tempo</span>
                  <span className="font-medium text-red-600">{formatDateShort(extendRental.tanggalKembali)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tagihan Awal</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(extendRental.totalHarga)}</span>
                </div>
                {extendRental.extensions && extendRental.extensions.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Perpanjangan Sebelumnya</span>
                    <span className="font-medium text-amber-700">
                      {extendRental.extensions.length}x ({formatCurrency(
                        extendRental.extensions.reduce((sum, ext) => sum + ext.extensionTotal, 0)
                      )})
                    </span>
                  </div>
                )}
              </div>

              {/* Date picker instead of days input */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Tanggal Pengembalian Baru
                </Label>
                <Input
                  type="date"
                  value={extendDate}
                  onChange={(e) => setExtendDate(e.target.value)}
                  className="h-10"
                />
                {/* Quick presets */}
                <div className="flex gap-1.5 flex-wrap">
                  {datePresets.map((preset) => {
                    const presetDate = getPresetDate(preset.days);
                    const isActive = extendDate === presetDate;
                    return (
                      <button
                        key={preset.days}
                        onClick={() => setExtendDate(presetDate)}
                        className={`px-3 py-1 text-xs rounded-lg border transition-all ${
                          isActive
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "border-gray-200 text-gray-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              {extendDate && (() => {
                const estimate = getEstimatedExtensionTotal();
                if (!estimate) return null;
                const { total: extTotal, days: extDays } = estimate;
                const existingExtTotal = (extendRental.extensions || []).reduce((s, e) => s + e.extensionTotal, 0);
                const newGrandTotal = extendRental.totalHarga + existingExtTotal + extTotal;

                return (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2 animate-fade-in-up">
                    <p className="text-xs text-emerald-700 font-semibold">Preview Perpanjangan</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">Tanggal Kembali Baru</span>
                      <span className="font-medium text-emerald-900">{toReadableDate(extendDate)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">Durasi Perpanjangan</span>
                      <span className="font-medium text-emerald-900">{extDays} hari</span>
                    </div>
                    <div className="border-t border-emerald-200 pt-2 mt-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tagihan Awal</span>
                        <span className="font-medium text-gray-700">{formatCurrency(extendRental.totalHarga)}</span>
                      </div>
                      {existingExtTotal > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Perpanjangan Sebelumnya</span>
                          <span className="font-medium text-amber-600">+{formatCurrency(existingExtTotal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-700 font-semibold">Tagihan Perpanjangan Baru</span>
                        <span className="font-bold text-amber-700">+{formatCurrency(extTotal)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm bg-emerald-100/50 rounded-md px-2 py-1.5">
                      <span className="text-emerald-800 font-bold">Total Keseluruhan</span>
                      <span className="font-bold text-emerald-800">{formatCurrency(newGrandTotal)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExtendDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
              disabled={extendLoading || !extendDate}
              onClick={handleExtend}
            >
              {extendLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CalendarClock className="w-3.5 h-3.5 mr-1" />
                  Perpanjang
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Edit Extension Dialog ===== */}
      <Dialog open={editExtDialogOpen} onOpenChange={setEditExtDialogOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Pencil className="w-5 h-5 text-blue-700" />
              </div>
              Ubah Tanggal Perpanjangan
            </DialogTitle>
          </DialogHeader>

          {editExtRental && editExtId && (
            <div className="space-y-4">
              {/* Current extension info */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                <p className="text-xs text-gray-500">Penyewa</p>
                <p className="text-sm font-medium text-gray-900">{editExtRental.namaPenyewa}</p>

                {(() => {
                  const ext = editExtRental.extensions.find((e) => e.id === editExtId);
                  if (!ext) return null;
                  return (
                    <>
                      <div className="flex justify-between text-sm pt-1">
                        <span className="text-gray-600">Jatuh Tempo Sebelumnya</span>
                        <span className="font-medium text-gray-900">{formatDateShort(ext.previousTanggalKembali)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Jatuh Tempo Saat Ini</span>
                        <span className="font-medium text-amber-700">{formatDateShort(ext.newTanggalKembali)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Durasi</span>
                        <span className="font-medium text-gray-900">{ext.extensionDays} hari</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tagihan Perpanjangan</span>
                        <span className="font-bold text-amber-700">{formatCurrency(ext.extensionTotal)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* New date input */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Tanggal Pengembalian Baru
                </Label>
                <Input
                  type="date"
                  value={editExtDate}
                  onChange={(e) => setEditExtDate(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Preview of new values */}
              {editExtDate && (() => {
                const selectedDate = new Date(editExtDate);
                const ext = editExtRental.extensions.find((e) => e.id === editExtId);
                if (!ext) return null;
                const prevKembali = new Date(ext.previousTanggalKembali);
                prevKembali.setHours(0, 0, 0, 0);
                const startDate = new Date(prevKembali);
                startDate.setDate(startDate.getDate() + 1);
                const newDays = daysBetween(startDate, selectedDate);

                let newTotal = 0;
                for (const item of editExtRental.items) {
                  let multiplier = newDays;
                  if (item.billingType === "bulanan") {
                    multiplier = Math.max(1, Math.ceil(newDays / 30));
                  }
                  newTotal += item.jumlah * item.harga * multiplier;
                }

                return (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2 animate-fade-in-up">
                    <p className="text-xs text-blue-700 font-semibold">Preview Perubahan</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600">Tanggal Baru</span>
                      <span className="font-medium text-blue-900">{toReadableDate(editExtDate)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600">Durasi Baru</span>
                      <span className="font-medium text-blue-900">{newDays} hari</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-blue-200 pt-1 mt-1">
                      <span className="text-amber-700 font-semibold">Tagihan Baru</span>
                      <span className="font-bold text-amber-700">{formatCurrency(newTotal)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditExtDialogOpen(false)}
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Batal
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={editExtLoading || !editExtDate}
              onClick={handleEditExtension}
            >
              {editExtLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1" />
                  Simpan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
