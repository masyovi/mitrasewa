"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Package,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Download,
  FileBarChart,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateShort } from "./helpers";

interface MonthlyBreakdown {
  monthKey: string;
  month: string;
  revenue: number;
  count: number;
}

interface TopItem {
  item: string;
  label: string;
  totalJumlah: number;
  rentalCount: number;
}

interface UtilizationItem {
  item: string;
  label: string;
  unit: string;
  total: number;
  disewa: number;
  tersedia: number;
  rate: number;
}

interface AnalyticsData {
  totalRevenue: number;
  totalRentals: number;
  activeRentals: number;
  avgDuration: number;
  monthlyBreakdown: MonthlyBreakdown[];
  topItems: TopItem[];
  utilization: UtilizationItem[];
}

const PIE_COLORS = ["#059669", "#d97706", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"];
const REVENUE_BAR_COLOR = "oklch(0.62 0.17 163)";
const TOP_ITEM_BAR_COLOR = "#2563eb";

function getDefaultDates() {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const from = sixMonthsAgo.toISOString().split("T")[0];
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
  return { from, to };
}

function getPresetRange(preset: string): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const to = today.toISOString().split("T")[0];
  const from = new Date(today);

  switch (preset) {
    case "6bulan":
      from.setMonth(from.getMonth() - 6);
      break;
    case "3bulan":
      from.setMonth(from.getMonth() - 3);
      break;
    case "1bulan":
      from.setMonth(from.getMonth() - 1);
      break;
    case "minggu": {
      const day = from.getDay() || 7;
      from.setDate(from.getDate() - day + 1);
      break;
    }
    case "hari":
      break;
  }
  return { from: from.toISOString().split("T")[0], to };
}

export function LaporanTab() {
  const { from: defaultFrom, to: defaultTo } = getDefaultDates();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Chart theme colors
  const gridStroke = isDark ? "#333" : "#f0f0f0";
  const axisTickFill = isDark ? "#9ca3af" : "#6b7280";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipBorder = isDark ? "#374151" : "#e5e7eb";
  const tooltipText = isDark ? "#f3f4f6" : "#111827";
  const legendColor = isDark ? "#d1d5db" : "#374151";

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?from=${from}&to=${to}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const handlePresetClick = (preset: string) => {
    const range = getPresetRange(preset);
    setActivePreset(preset);
    setFrom(range.from);
    setTo(range.to);
  };

  const handleDateChange = (field: "from" | "to", value: string) => {
    setActivePreset(null);
    if (field === "from") setFrom(value);
    else setTo(value);
  };

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExport = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const lines: string[] = [
        "LAPORAN ANALITIK MITRA SEWA",
        `Periode: ${from} s/d ${to}`,
        "",
        "=== RINGKASAN ===",
        `Total Pendapatan: Rp ${data.totalRevenue.toLocaleString("id-ID")}`,
        `Total Penyewaan: ${data.totalRentals}`,
        `Penyewaan Aktif: ${data.activeRentals}`,
        `Rata-rata Durasi: ${data.avgDuration} hari`,
        "",
        "=== PENDAPATAN BULANAN ===",
        "Bulan\tPendapatan\tJumlah Transaksi",
      ];

      for (const m of data.monthlyBreakdown) {
        lines.push(
          `${m.month}\tRp ${m.revenue.toLocaleString("id-ID")}\t${m.count}`
        );
      }

      if (data.topItems.length > 0) {
        lines.push("", "=== ALAT PALING BANYAK DISEWA ===");
        lines.push("Alat\tTotal Unit\tJumlah Transaksi");
        for (const item of data.topItems) {
          lines.push(
            `${item.label}\t${item.totalJumlah}\t${item.rentalCount}`
          );
        }
      }

      if (data.utilization.length > 0) {
        lines.push("", "=== UTILISASI ALAT ===");
        lines.push("Alat\tTotal\tDisewa\tTersedia\tUtilisasi (%)");
        for (const u of data.utilization) {
          lines.push(
            `${u.label}\t${u.total}\t${u.disewa}\t${u.tersedia}\t${u.rate}%`
          );
        }
      }

      const blob = new Blob(["\uFEFF" + lines.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan_analitik_${from}_${to}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  const maxTopItemAmount =
    data?.topItems.length
      ? Math.max(...data.topItems.map((i) => i.totalJumlah))
      : 1;

  // Prepare pie chart data from utilization
  const pieData = data?.utilization.map((u) => ({
    name: u.label,
    value: u.total,
    disewa: u.disewa,
    tersedia: u.tersedia,
  })) || [];

  // Prepare top items data sorted by totalJumlah ascending for horizontal bar chart (recharts renders bottom-to-top)
  const topItemsChartData = data?.topItems
    ? [...data.topItems].reverse()
    : [];

  // Custom tooltip styles
  const customTooltipStyle: React.CSSProperties = {
    backgroundColor: tooltipBg,
    border: `1px solid ${tooltipBorder}`,
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
    padding: "10px 14px",
  };

  // Custom tooltip label style
  const customTooltipLabelStyle: React.CSSProperties = {
    color: tooltipText,
    fontWeight: 600,
    fontSize: "12px",
    marginBottom: "4px",
  };

  // Custom tooltip item style
  const customTooltipItemStyle: React.CSSProperties = {
    color: tooltipText,
    fontSize: "12px",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Laporan Analitik</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Analisis data penyewaan alat konstruksi
          </p>
        </div>

        {/* Date filter */}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-end gap-3 animate-fade-in-up"
          style={{ animationDelay: "0.05s" }}
        >
          {/* Preset date range buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "6bulan", label: "6 Bulan" },
              { key: "3bulan", label: "3 Bulan" },
              { key: "1bulan", label: "1 Bulan" },
              { key: "minggu", label: "Minggu Ini" },
              { key: "hari", label: "Hari Ini" },
            ].map((preset) => (
              <button
                key={preset.key}
                onClick={() => handlePresetClick(preset.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  activePreset === preset.key
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500 dark:text-gray-400">Dari</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => handleDateChange("from", e.target.value)}
                  className="pl-8 h-9 w-40 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500 dark:text-gray-400">Sampai</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => handleDateChange("to", e.target.value)}
                  className="pl-8 h-9 w-40 text-sm"
                />
              </div>
            </div>
          </div>
          <Button
            onClick={fetchAnalytics}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950"
            disabled={loading}
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950"
            disabled={loading || exporting || !data}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {exporting ? "Mengunduh..." : "Export"}
            </span>
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : data ? (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Pendapatan"
              value={formatCurrency(data.totalRevenue)}
              icon={<DollarSign className="w-4 h-4" />}
              color="emerald"
              delay="0s"
            />
            <StatCard
              title="Total Penyewaan"
              value={String(data.totalRentals)}
              subtitle="transaksi"
              icon={<Package className="w-4 h-4" />}
              color="blue"
              delay="0.05s"
            />
            <StatCard
              title="Penyewaan Aktif"
              value={String(data.activeRentals)}
              subtitle="sedang berjalan"
              icon={<Activity className="w-4 h-4" />}
              color="amber"
              delay="0.1s"
            />
            <StatCard
              title="Rata-rata Durasi"
              value={`${data.avgDuration} hari`}
              icon={<Clock className="w-4 h-4" />}
              color="violet"
              delay="0.15s"
            />
          </div>

          {/* ─── NEW: Charts Row (2-column grid) ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Revenue Bar Chart */}
            <Card className="border-0 shadow-md card-hover animate-fade-in-up" style={{ animationDelay: "0.18s" }}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-100">
                      Pendapatan Bulanan
                    </CardTitle>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Grafik pendapatan per bulan
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.monthlyBreakdown.length === 0 ? (
                  <EmptyState message="Belum ada data pendapatan pada periode ini" />
                ) : (
                  <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.monthlyBreakdown}
                        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={gridStroke}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="month"
                          tick={{ fill: axisTickFill, fontSize: 11 }}
                          axisLine={{ stroke: gridStroke }}
                          tickLine={false}
                          interval={0}
                          angle={-25}
                          textAnchor="end"
                          height={55}
                        />
                        <YAxis
                          tick={{ fill: axisTickFill, fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value: number) => {
                            if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
                            if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
                            return String(value);
                          }}
                          width={55}
                        />
                        <Tooltip
                          contentStyle={customTooltipStyle}
                          labelStyle={customTooltipLabelStyle}
                          itemStyle={customTooltipItemStyle}
                          cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
                          formatter={(value: number) => [
                            formatCurrency(value),
                            "Pendapatan",
                          ]}
                        />
                        <Bar
                          dataKey="revenue"
                          fill={REVENUE_BAR_COLOR}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={48}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Equipment Distribution Donut Chart */}
            <Card className="border-0 shadow-md card-hover animate-fade-in-up" style={{ animationDelay: "0.22s" }}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                    <FileBarChart className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-100">
                      Distribusi Stok Alat
                    </CardTitle>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Proporsi jumlah alat berdasarkan jenis
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <EmptyState message="Belum ada data stok alat" />
                ) : (
                  <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {pieData.map((_entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={customTooltipStyle}
                          labelStyle={customTooltipLabelStyle}
                          itemStyle={customTooltipItemStyle}
                          formatter={(value: number, name: string, props: any) => {
                            const item = props.payload;
                            return [
                              `${value} unit (Disewa: ${item.disewa}, Tersedia: ${item.tersedia})`,
                              item.name,
                            ];
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: "11px", color: legendColor, paddingTop: "8px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Monthly Revenue Table */}
          <Card className="border-0 shadow-md card-hover animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-100">
                    Detail Pendapatan Bulanan
                  </CardTitle>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Breakdown pendapatan per bulan
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {data.monthlyBreakdown.length === 0 ? (
                <EmptyState message="Belum ada data pendapatan pada periode ini" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <th className="text-left py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                          Bulan
                        </th>
                        <th className="text-right py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                          Pendapatan
                        </th>
                        <th className="text-center py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                          Transaksi
                        </th>
                        <th className="text-right py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider hidden sm:table-cell">
                          Visualisasi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="max-h-96 overflow-y-auto">
                      {data.monthlyBreakdown.map((m, idx) => {
                        const maxRev = Math.max(
                          ...data.monthlyBreakdown.map((x) => x.revenue),
                          1
                        );
                        const pct = (m.revenue / maxRev) * 100;
                        const prevRev =
                          idx > 0 ? data.monthlyBreakdown[idx - 1].revenue : 0;
                        const trend = m.revenue >= prevRev ? "up" : "down";

                        return (
                          <tr
                            key={m.monthKey}
                            className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="py-2.5 px-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {m.month}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold text-gray-800 dark:text-gray-100">
                              {formatCurrency(m.revenue)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <Badge
                                variant="secondary"
                                className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 text-xs"
                              >
                                {m.count}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 hidden sm:table-cell">
                              <div className="flex items-center gap-2 justify-end">
                                <div className="w-32 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full progress-bar-animate"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                {m.revenue > 0 && (
                                  <span className="text-xs text-gray-400 w-4 flex justify-center">
                                    {trend === "up" ? (
                                      <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <ArrowDownRight className="w-3 h-3 text-red-400" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Equipment */}
            <Card className="border-0 shadow-md card-hover animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-100">
                      Alat Paling Banyak Disewa
                    </CardTitle>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Berdasarkan jumlah unit yang disewakan
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.topItems.length === 0 ? (
                  <EmptyState message="Belum ada data penyewaan" />
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                    {data.topItems.map((item, idx) => {
                      const pct =
                        maxTopItemAmount > 0
                          ? (item.totalJumlah / maxTopItemAmount) * 100
                          : 0;
                      return (
                        <div key={item.item} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-5">
                                #{idx + 1}
                              </span>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {item.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs"
                              >
                                {item.totalJumlah} unit
                              </Badge>
                            </div>
                          </div>
                          <div className="ml-7 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full progress-bar-animate"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Equipment Utilization */}
            <Card className="border-0 shadow-md card-hover animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                    <FileBarChart className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-100">
                      Utilisasi Alat
                    </CardTitle>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Persentase alat yang sedang disewa
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.utilization.length === 0 ? (
                  <EmptyState message="Belum ada data stok alat" />
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                    {data.utilization.map((u) => {
                      const barColor =
                        u.rate >= 80
                          ? "bg-red-500"
                          : u.rate >= 50
                            ? "bg-amber-500"
                            : "bg-emerald-500";
                      const badgeColor =
                        u.rate >= 80
                          ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          : u.rate >= 50
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";

                      return (
                        <div key={u.item} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {u.label}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {u.disewa}/{u.total}
                              </span>
                              <Badge
                                variant="secondary"
                                className={`${badgeColor} text-xs`}
                              >
                                {u.rate}%
                              </Badge>
                            </div>
                          </div>
                          <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${barColor} rounded-full progress-bar-animate`}
                              style={{ width: `${Math.min(u.rate, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ─── NEW: Top Equipment Horizontal Bar Chart ─── */}
          {data.topItems.length > 0 && (
            <Card className="border-0 shadow-md card-hover animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-100">
                      Perbandingan Alat Disewa
                    </CardTitle>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Grafik perbandingan jumlah unit per jenis alat
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full" style={{ height: `${Math.max(topItemsChartData.length * 48, 120)}px` }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topItemsChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={gridStroke}
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fill: axisTickFill, fontSize: 11 }}
                        axisLine={{ stroke: gridStroke }}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        tick={{ fill: axisTickFill, fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={120}
                      />
                      <Tooltip
                        contentStyle={customTooltipStyle}
                        labelStyle={customTooltipLabelStyle}
                        itemStyle={customTooltipItemStyle}
                        cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
                        formatter={(value: number) => [`${value} unit`, "Total Disewa"]}
                      />
                      <Bar
                        dataKey="totalJumlah"
                        fill={TOP_ITEM_BAR_COLOR}
                        radius={[0, 4, 4, 0]}
                        maxBarSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <EmptyState message="Gagal memuat data. Silakan coba lagi." />
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  delay,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: "emerald" | "blue" | "amber" | "violet";
  delay: string;
}) {
  const colorMap = {
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      iconBg: "bg-emerald-600",
      iconText: "text-white",
      valueText: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-100 dark:border-emerald-900/60",
    },
    blue: {
      bg: "bg-blue-50 dark:bg-blue-950/40",
      iconBg: "bg-blue-600",
      iconText: "text-white",
      valueText: "text-blue-700 dark:text-blue-400",
      border: "border-blue-100 dark:border-blue-900/60",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-950/40",
      iconBg: "bg-amber-600",
      iconText: "text-white",
      valueText: "text-amber-700 dark:text-amber-400",
      border: "border-amber-100 dark:border-amber-900/60",
    },
    violet: {
      bg: "bg-violet-50 dark:bg-violet-950/40",
      iconBg: "bg-violet-600",
      iconText: "text-white",
      valueText: "text-violet-700 dark:text-violet-400",
      border: "border-violet-100 dark:border-violet-900/60",
    },
  };

  const c = colorMap[color];

  return (
    <Card
      className={`border-0 shadow-md card-hover animate-fade-in-up ${c.bg} ${c.border}`}
      style={{ animationDelay: delay }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {title}
            </p>
            <p className={`text-xl font-bold ${c.valueText}`}>{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
          <div
            className={`w-9 h-9 rounded-lg ${c.iconBg} flex items-center justify-center ${c.iconText} shrink-0`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <BarChart3 className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
      <p className="text-sm text-gray-400 dark:text-gray-500">{message}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      {/* Chart skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[380px] rounded-xl" />
        <Skeleton className="h-[380px] rounded-xl" />
      </div>
      <Skeleton className="h-72 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}
