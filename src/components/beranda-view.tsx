"use client";

import { useAppStore } from "@/store/use-store";
import { useTheme } from "next-themes";
import {
  Building2,
  ShieldCheck,
  AlertTriangle,
  Info,
  Phone,
  MapPin,
  MessageCircle,
  Sun,
  Moon,
  Calculator,
  DollarSign,
  Clock,
  HeadphonesIcon,
  Star,
  X,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState, useRef } from "react";
import { AboutModal } from "@/components/about-modal";
import { formatCurrency } from "@/components/admin/helpers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StockItem {
  item: string;
  label: string;
  unit: string;
  total: number;
  disewa: number;
  perbaikan: number;
  tersedia: number;
}

interface PriceItem {
  item: string;
  label: string;
  unit: string;
  price: number;
  billingType: string;
}

export function BerandaView() {
  const { setView } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [priceData, setPriceData] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [mounted, setMounted] = useState(false);


  // Calculator state
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [duration, setDuration] = useState<number>(1);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);


  // Equipment detail modal state
  const [selectedEquipDetail, setSelectedEquipDetail] = useState<StockItem | null>(null);

  // Scroll reveal refs
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    sectionRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  function handleEquipmentClick(item: StockItem) {
    setSelectedEquipDetail(item);
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [stockRes, priceRes] = await Promise.all([
          fetch("/api/stock"),
          fetch("/api/prices"),
        ]);
        const stockJson = await stockRes.json();
        const priceJson = await priceRes.json();
        if (stockJson.success) {
          setStockData(stockJson.data);
        }
        if (priceJson.success) {
          setPriceData(priceJson.data);
          if (priceJson.data.length > 0) {
            setSelectedEquipment(priceJson.data[0].item);
          }
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const scaffolding = stockData.find((s) => s.item === "scaffolding");
  const machines = stockData.filter(
    (s) => s.item === "mesin_stamper" || s.item === "mesin_molen"
  );
  const komponen = stockData.filter(
    (s) => s.item === "shock" || s.item === "u_head" || s.item === "catwalk"
  );

  const selectedPriceItem = priceData.find(
    (p) => p.item === selectedEquipment
  );

  function handleCalculate() {
    if (!selectedPriceItem) return;
    const multiplier =
      selectedPriceItem.billingType === "bulanan"
        ? Math.ceil(duration / 30)
        : duration;
    const cost = selectedPriceItem.price * quantity * multiplier;
    setEstimatedCost(cost);
    setShowResult(true);
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-mitra-gradient text-white sticky top-0 z-50 shadow-lg animate-fade-in">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2.5">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                MITRA SEWA
              </h1>
              <p className="text-xs sm:text-sm text-white/80">
                Penyewaan Alat Konstruksi Terpercaya
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-white/80 hover:text-white hover:bg-white/20 transition-all"
                aria-label="Toggle dark mode"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAboutOpen(true)}
              className="text-white/80 hover:text-white hover:bg-white/20 transition-all"
            >
              <Info className="w-5 h-5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setView("login")}
              className="hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-0 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setView("login")}
              className="sm:hidden text-white hover:bg-white/20 transition-all"
            >
              <ShieldCheck className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-mesh-gradient hero-pattern px-4 py-10 sm:py-16 animate-fade-in relative overflow-hidden">
        {/* Decorative gear pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
             style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 20 20\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'4\' fill=\'none\' stroke=\'%2310b981\' stroke-width=\'1\'/%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'1.5\' fill=\'%2310b981\'/%3E%3Cline x1=\'10\' y1=\'1\' x2=\'10\' y2=\'5\' stroke=\'%2310b981\' stroke-width=\'1.5\' stroke-linecap=\'round\'/%3E%3Cline x1=\'10\' y1=\'15\' x2=\'10\' y2=\'19\' stroke=\'%2310b981\' stroke-width=\'1.5\' stroke-linecap=\'round\'/%3E%3Cline x1=\'1\' y1=\'10\' x2=\'5\' y2=\'10\' stroke=\'%2310b981\' stroke-width=\'1.5\' stroke-linecap=\'round\'/%3E%3Cline x1=\'15\' y1=\'10\' x2=\'19\' y2=\'10\' stroke=\'%2310b981\' stroke-width=\'1.5\' stroke-linecap=\'round\'/%3E%3C/svg%3E")'}} />

        <div className="relative overflow-hidden rounded-2xl">
          {/* Animated gradient border */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-teal-400/10 to-emerald-400/20 animate-spin-slow"
               style={{ animationDuration: '8s' }} />
          <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-medium mb-4 animate-fade-in-up">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-green" />
            Tersedia untuk disewa
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 animate-fade-in-up animate-fade-in-up-delay-1">
            Solusi Alat Konstruksi
            <span className="text-emerald-600"> Terlengkap</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base animate-fade-in-up animate-fade-in-up-delay-2">
            Menyediakan berbagai peralatan konstruksi berkualitas dengan harga
            terjangkau. Scaffolding, mesin stamper, mesin molen, dan lainnya.
          </p>

          {/* Quick stats in hero */}
          {!loading && (
            <div className="flex flex-wrap justify-center gap-6 mt-8 animate-fade-in-up animate-fade-in-up-delay-3">
              <div className="text-center hover-lift rounded-xl px-4 py-2">
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600 stat-number">
                  {stockData.length}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Jenis Alat</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center hover-lift rounded-xl px-4 py-2">
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600 stat-number">
                  {stockData.reduce((sum, s) => sum + s.tersedia, 0)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Unit Tersedia</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center hover-lift rounded-xl px-4 py-2">
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600 stat-number">
                  {stockData.filter((s) => s.perbaikan > 0).length}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Dalam Perbaikan
                </p>
              </div>

            </div>
          )}

        </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Scaffolding Stats */}
        <section
          ref={(el) => { sectionRefs.current[0] = el; }}
          className="reveal"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900">Scaffolding</h3>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 sm:h-28 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <Card className="border-0 shadow-md bg-white card-shine animate-fade-in-up">
                <CardContent className="p-4 sm:p-6 text-center">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">
                    Total Set
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 animate-count-up stat-number">
                    {scaffolding?.total ?? 0}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">set</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md bg-emerald-50 card-shine animate-fade-in-up animate-fade-in-up-delay-1">
                <CardContent className="p-4 sm:p-6 text-center">
                  <p className="text-xs sm:text-sm text-emerald-700 mb-1">
                    Tersedia
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-600 animate-count-up stat-number">
                    {scaffolding?.tersedia ?? 0}
                  </p>
                  <p className="text-xs text-emerald-500 mt-1">set</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md bg-amber-50 card-shine animate-fade-in-up animate-fade-in-up-delay-2">
                <CardContent className="p-4 sm:p-6 text-center">
                  <p className="text-xs sm:text-sm text-amber-700 mb-1">
                    Disewa
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-amber-600 animate-count-up stat-number">
                    {scaffolding?.disewa ?? 0}
                  </p>
                  <p className="text-xs text-amber-500 mt-1">set</p>
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        {/* Equipment Status */}
        <section
          ref={(el) => { sectionRefs.current[1] = el; }}
          className="reveal"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900">Status Alat</h3>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {machines.map((machine) => {
                const isPerbaikan = machine.perbaikan > 0;
                const isHabis = machine.tersedia <= 0 && !isPerbaikan;

                return (
                  <Card
                    key={machine.item}
                    className="border-0 shadow-md bg-white overflow-hidden card-elevated cursor-pointer"
                    onClick={() => handleEquipmentClick(machine)}
                  >
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                              {machine.label}
                            </h4>
                            {isPerbaikan && (
                              <Badge className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0 h-5 border-0">
                                <AlertTriangle className="w-3 h-3 mr-0.5" />
                                {machine.perbaikan} perbaikan
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Tersedia: {machine.tersedia} / {machine.total}{" "}
                            {machine.unit}
                          </p>
                        </div>
                        <Badge
                          className={`text-xs sm:text-sm px-3 py-1 ${
                            isPerbaikan
                              ? "bg-orange-100 text-orange-700"
                              : isHabis
                                ? "bg-red-100 text-red-700"
                                : "status-ready"
                          }`}
                        >
                          <span
                            className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                              isPerbaikan
                                ? "bg-orange-500"
                                : isHabis
                                  ? "bg-red-500"
                                  : "bg-emerald-500"
                            }`}
                          />
                          {isPerbaikan
                            ? "Perbaikan"
                            : isHabis
                              ? "Habis"
                              : "Ready"}
                        </Badge>
                      </div>
                      <div className="mt-4 h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                        {machine.disewa > 0 && (
                          <div
                            className="h-full bg-amber-400 progress-bar-animate"
                            style={{
                              width: `${
                                machine.total > 0
                                  ? (machine.disewa / machine.total) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        )}
                        {isPerbaikan && (
                          <div
                            className="h-full bg-orange-400 progress-bar-animate"
                            style={{
                              width: `${
                                machine.total > 0
                                  ? (machine.perbaikan / machine.total) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        )}
                        {machine.tersedia > 0 && (
                          <div
                            className="h-full bg-emerald-500 progress-bar-animate"
                            style={{
                              width: `${
                                machine.total > 0
                                  ? (machine.tersedia / machine.total) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        )}
                      </div>
                      <div className="flex gap-3 mt-1.5">
                        {machine.tersedia > 0 && (
                          <span className="text-[10px] text-emerald-600">
                            ■ Tersedia
                          </span>
                        )}
                        {machine.disewa > 0 && (
                          <span className="text-[10px] text-amber-500">
                            ■ Disewa
                          </span>
                        )}
                        {isPerbaikan && (
                          <span className="text-[10px] text-orange-500">
                            ■ Perbaikan
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Komponen Scaffolding */}
        <section
          ref={(el) => { sectionRefs.current[2] = el; }}
          className="reveal"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900">
              Komponen Scaffolding
            </h3>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {komponen.map((item) => {
                const isPerbaikan = item.perbaikan > 0;

                return (
                  <Card
                    key={item.item}
                    className={`border-0 shadow-md bg-white overflow-hidden card-elevated cursor-pointer ${
                      isPerbaikan ? "ring-1 ring-orange-200" : ""
                    }`}
                    onClick={() => handleEquipmentClick(item)}
                  >
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                          {item.label}
                        </h4>
                        <div className="flex items-center gap-1.5">
                          {isPerbaikan && (
                            <Badge className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0 h-5 border-0">
                              <AlertTriangle className="w-3 h-3 mr-0.5" />
                              {item.perbaikan} perbaikan
                            </Badge>
                          )}
                          <span className="text-xs text-gray-400">
                            per {item.unit}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-50 rounded-lg py-2.5 transition-colors hover:bg-gray-100">
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="font-bold text-gray-900">
                            {item.total}
                          </p>
                        </div>
                        <div className="bg-emerald-50 rounded-lg py-2.5 transition-colors hover:bg-emerald-100">
                          <p className="text-xs text-emerald-600">Tersedia</p>
                          <p className="font-bold text-emerald-700">
                            {item.tersedia}
                          </p>
                        </div>
                        <div className="bg-amber-50 rounded-lg py-2.5 transition-colors hover:bg-amber-100">
                          <p className="text-xs text-amber-600">Disewa</p>
                          <p className="font-bold text-amber-700">
                            {item.disewa}
                          </p>
                        </div>
                      </div>
                      {isPerbaikan && (
                        <div className="mt-2 bg-orange-50 rounded-lg py-1.5 px-3 text-center">
                          <p className="text-[10px] text-orange-600">
                            <AlertTriangle className="w-3 h-3 inline mr-0.5" />
                            {item.perbaikan} {item.unit} sedang dalam perbaikan
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Contact Section */}
        <section
          ref={(el) => { sectionRefs.current[3] = el; }}
          className="reveal"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900">Hubungi Kami</h3>
          </div>
          <Card className="border-0 shadow-md bg-white overflow-hidden card-elevated">
            <CardContent className="p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 hover-lift rounded-xl p-2 -m-2">
                  <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2.5 rounded-xl flex-shrink-0">
                    <Phone className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      Telepon / WhatsApp
                    </p>
                    <p className="text-sm text-emerald-600 font-medium mt-0.5">
                      0812-3456-7890
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Hubungi kami untuk informasi harga & ketersediaan alat
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 hover-lift rounded-xl p-2 -m-2">
                  <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2.5 rounded-xl flex-shrink-0">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Lokasi</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Pengelola Gedung Pusat BMT NU Ngasem Group
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ===== NEW SECTION: Jam Operasional ===== */}
        <section className="animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900">Jam Operasional</h3>
          </div>
          <Card className="border-0 shadow-md bg-white overflow-hidden card-elevated">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2 rounded-xl">
                  <Clock className="w-5 h-5 text-emerald-600" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Jam Operasional</h4>
              </div>
              <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  { day: "Senin", hours: "08:00 - 17:00", status: "open" as const },
                  { day: "Selasa", hours: "08:00 - 17:00", status: "open" as const },
                  { day: "Rabu", hours: "08:00 - 17:00", status: "open" as const },
                  { day: "Kamis", hours: "08:00 - 17:00", status: "open" as const },
                  { day: "Jumat", hours: "08:00 - 17:00", status: "open" as const },
                  { day: "Sabtu", hours: "08:00 - 12:00", status: "partial" as const },
                  { day: "Minggu", hours: "Tutup", status: "closed" as const },
                ].map((row) => (
                  <div
                    key={row.day}
                    className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          row.status === "open"
                            ? "bg-emerald-500"
                            : row.status === "partial"
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {row.day}
                      </span>
                    </div>
                    <span
                      className={`text-sm ${
                        row.status === "closed"
                          ? "text-red-500 font-medium"
                          : row.status === "partial"
                            ? "text-amber-600 font-medium"
                            : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {row.hours}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Untuk pemesanan di luar jam operasional, silakan hubungi kami via{" "}
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">WhatsApp</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ===== NEW SECTION: FAQ (Pertanyaan Umum) ===== */}
        <section className="animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900">Pertanyaan Umum</h3>
          </div>
          <Card className="border-0 shadow-md bg-white overflow-hidden card-elevated">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2 rounded-xl">
                  <HelpCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Pertanyaan Umum</h4>
              </div>
              <div className="space-y-3">
                {[
                  {
                    q: "Bagaimana cara menyewa alat?",
                    a: "Hubungi kami via WhatsApp atau telepon di 0812-3456-7890. Pilih alat yang dibutuhkan, tentukan tanggal sewa dan durasi, lalu kami akan menyiapkan alat untuk Anda.",
                  },
                  {
                    q: "Apa syarat penyewaan?",
                    a: "Cukup menyebutkan identitas diri (nama, alamat, no HP) dan lokasi proyek. Tidak perlu deposit untuk penyewaan pertama.",
                  },
                  {
                    q: "Berapa lama minimum sewa?",
                    a: "Minimum sewa adalah 1 hari. Untuk mesin molen dan mesin stamper, tersedia paket bulanan dengan harga lebih hemat.",
                  },
                  {
                    q: "Apakah ada pengiriman alat?",
                    a: "Ya, kami menyediakan jasa pengiriman untuk area Surabaya dan sekitarnya. Biaya pengiriman disesuaikan dengan jarak lokasi.",
                  },
                  {
                    q: "Bagaimana jika alat rusak saat disewa?",
                    a: "Segala kerusakan akibat pemakaian normal ditanggung oleh kami. Kerusakan akibat kelalaian penyewa akan dikenakan biaya perbaikan sesuai tingkat kerusakan.",
                  },
                ].map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden transition-all hover-lift"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {faq.q}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <p className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ===== NEW SECTION: Kalkulator Biaya Sewa ===== */}
        <section
          ref={(el) => { sectionRefs.current[4] = el; }}
          className="reveal"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900">
              Kalkulator Biaya Sewa
            </h3>
          </div>
          <Card className="border-0 shadow-md bg-white overflow-hidden card-elevated">
            {/* Emerald gradient header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 sm:px-6 py-4 flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm sm:text-base">
                  Hitung Estimasi Biaya Sewa
                </p>
                <p className="text-white/70 text-xs">
                  Pilih alat dan hitung perkiraan biaya penyewaan
                </p>
              </div>
            </div>
            <CardContent className="p-5 sm:p-6 space-y-4">
              {/* Equipment selector */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Jenis Alat
                </Label>
                {priceData.length > 0 ? (
                  <Select
                    value={selectedEquipment}
                    onValueChange={(val) => {
                      setSelectedEquipment(val);
                      setShowResult(false);
                    }}
                  >
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="Pilih jenis alat..." />
                    </SelectTrigger>
                    <SelectContent>
                      {priceData.map((p) => (
                        <SelectItem key={p.item} value={p.item}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Skeleton className="h-10 w-full rounded-md" />
                )}
              </div>

              {/* Price info */}
              {selectedPriceItem && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">
                    Harga per {selectedPriceItem.unit}
                  </span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 stat-number">
                    {formatCurrency(selectedPriceItem.price)}{" "}
                    <span className="text-xs font-normal">
                      / {selectedPriceItem.billingType === "bulanan" ? "bulan" : "hari"}
                    </span>
                  </span>
                </div>
              )}

              {/* Quantity & Duration inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="calc-qty"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Jumlah ({selectedPriceItem?.unit ?? "unit"})
                  </Label>
                  <Input
                    id="calc-qty"
                    type="number"
                    min={1}
                    max={100}
                    value={quantity}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(1, Number(e.target.value) || 1));
                      setQuantity(val);
                      setShowResult(false);
                    }}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="calc-days"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Durasi Sewa (hari)
                  </Label>
                  <Input
                    id="calc-days"
                    type="number"
                    min={1}
                    max={365}
                    value={duration}
                    onChange={(e) => {
                      const val = Math.min(365, Math.max(1, Number(e.target.value) || 1));
                      setDuration(val);
                      setShowResult(false);
                    }}
                    className="h-10"
                  />
                </div>
              </div>

              {/* Billing info */}
              {selectedPriceItem && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {selectedPriceItem.billingType === "bulanan"
                    ? `Tagihan bulanan: ${Math.ceil(duration / 30)} bulan × ${formatCurrency(selectedPriceItem.price)} × ${quantity} ${selectedPriceItem.unit}`
                    : `Tagihan harian: ${duration} hari × ${formatCurrency(selectedPriceItem.price)} × ${quantity} ${selectedPriceItem.unit}`}
                </p>
              )}

              {/* Calculate button */}
              <Button
                onClick={handleCalculate}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold btn-press transition-all"
                disabled={!selectedPriceItem}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Hitung Estimasi
              </Button>

              {/* Result card */}
              {showResult && estimatedCost !== null && (
                <div
                  className={`bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-5 text-center animate-fade-in-up`}
                >
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1 font-medium uppercase tracking-wide">
                    Estimasi Total Biaya Sewa
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-300 stat-number">
                    {formatCurrency(estimatedCost)}
                  </p>
                  <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-2">
                    {quantity} {selectedPriceItem?.unit} × {duration} hari
                    {selectedPriceItem?.billingType === "bulanan"
                      ? ` (${Math.ceil(duration / 30)} bulan)`
                      : ""}
                  </p>
                  <Badge className="mt-3 bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 border-0 badge-glow-emerald text-xs">
                    *Estimasi, harga dapat berubah sewaktu-waktu
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ===== NEW SECTION: Kenapa Memilih Kami ===== */}
        <section
          ref={(el) => { sectionRefs.current[5] = el; }}
          className="reveal"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900">
              Kenapa Memilih Kami?
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Feature 1: Harga Terjangkau */}
            <Card className="border-0 shadow-md bg-white overflow-hidden card-elevated hover-lift transition-all">
              <CardContent className="p-5 text-center">
                <div className="bg-emerald-100 dark:bg-emerald-900/40 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1">
                  Harga Terjangkau
                </h4>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Tarif sewa kompetitif dengan kualitas alat terjamin
                </p>
              </CardContent>
            </Card>

            {/* Feature 2: Alat Berkualitas */}
            <Card className="border-0 shadow-md bg-white overflow-hidden card-elevated hover-lift transition-all">
              <CardContent className="p-5 text-center">
                <div className="bg-blue-100 dark:bg-blue-900/40 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1">
                  Alat Berkualitas
                </h4>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Semua peralatan dirawat dan diperiksa secara berkala
                </p>
              </CardContent>
            </Card>

            {/* Feature 3: Proses Cepat */}
            <Card className="border-0 shadow-md bg-white overflow-hidden card-elevated hover-lift transition-all">
              <CardContent className="p-5 text-center">
                <div className="bg-amber-100 dark:bg-amber-900/40 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1">
                  Proses Cepat
                </h4>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Peminjaman dan pengembalian alat yang mudah dan efisien
                </p>
              </CardContent>
            </Card>

            {/* Feature 4: Layanan 24/7 */}
            <Card className="border-0 shadow-md bg-white overflow-hidden card-elevated hover-lift transition-all">
              <CardContent className="p-5 text-center">
                <div className="bg-violet-100 dark:bg-violet-900/40 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <HeadphonesIcon className="w-7 h-7 text-violet-600 dark:text-violet-400" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1">
                  Layanan 24/7
                </h4>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Tim kami siap membantu kapan saja Anda butuhkan
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ===== NEW SECTION: Testimoni Pelanggan ===== */}
        <section
          ref={(el) => { sectionRefs.current[6] = el; }}
          className="reveal"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900">
              Testimoni Pelanggan
            </h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Testimonial 1 */}
            <Card className="border border-gray-100 dark:border-gray-800 shadow-md bg-white overflow-hidden card-elevated">
              <CardContent className="p-5 sm:p-6">
                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                  &ldquo;Alat scaffolding dari MITRA SEWA sangat berkualitas dan
                  harganya sangat bersaing. Proses sewa juga cepat dan
                  mudah.&rdquo;
                </p>
                {/* Name & Role */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      BS
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Budi Santoso
                    </p>
                    <p className="text-xs text-gray-400">Kontraktor</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="border border-gray-100 dark:border-gray-800 shadow-md bg-white overflow-hidden card-elevated">
              <CardContent className="p-5 sm:p-6">
                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                  &ldquo;Sudah 3 kali sewa mesin stamper di sini. Pelayanannya
                  ramah dan alatnya selalu dalam kondisi baik.&rdquo;
                </p>
                {/* Name & Role */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                      SR
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Siti Rahayu
                    </p>
                    <p className="text-xs text-gray-400">Mandor Proyek</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="border border-gray-100 dark:border-gray-800 shadow-md bg-white overflow-hidden card-elevated">
              <CardContent className="p-5 sm:p-6">
                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                  &ldquo;MITRA SEWA partner terpercaya untuk proyek-proyek kami.
                  Stok selalu tersedia dan pengiriman tepat waktu.&rdquo;
                </p>
                {/* Name & Role */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                      AF
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Ahmad Fauzi
                    </p>
                    <p className="text-xs text-gray-400">Pengembang</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/6281234567890"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-3.5 shadow-lg hover:shadow-xl transition-all animate-float no-print tooltip-modern"
        data-tooltip="Chat via WhatsApp"
        aria-label="Chat via WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </a>

      {/* Footer */}
      <footer className="bg-mitra-gradient text-white mt-auto no-print">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              <span className="font-bold">MITRA SEWA</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/60">
              <span>
                Didukung oleh{" "}
                <span className="font-semibold text-white/80">
                  Pengelola Gedung Pusat BMT NU Ngasem Group
                </span>
              </span>
            </div>
            <p className="text-xs text-white/60">
              &copy; {new Date().getFullYear()} MITRA SEWA. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Equipment Detail Modal */}
      {selectedEquipDetail && (() => {
        const eq = selectedEquipDetail;
        const eqPrice = priceData.find((p) => p.item === eq.item);
        const isPerbaikan = eq.perbaikan > 0;
        const isHabis = eq.tersedia <= 0 && !isPerbaikan;
        const statusLabel = isPerbaikan ? "Perbaikan" : isHabis ? "Habis" : "Ready";
        const statusColor = isPerbaikan ? "bg-orange-100 text-orange-700" : isHabis ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700";
        const dotColor = isPerbaikan ? "bg-orange-500" : isHabis ? "bg-red-500" : "bg-emerald-500";
        const gradientBg = isPerbaikan
          ? "from-orange-500 to-orange-400"
          : isHabis
            ? "from-red-500 to-red-400"
            : "from-emerald-600 to-emerald-500";

        const descriptions: Record<string, string> = {
          scaffolding: "Scaffolding merupakan sistem rangka baja yang digunakan untuk menopang pekerjaan konstruksi bangunan bertingkat. Tersedia dalam bentuk set lengkap termasuk frame, joint pin, dan u head.",
          mesin_stamper: "Mesin stamper digunakan untuk memadatkan tanah pada proyek konstruksi. Cocok untuk persiapan lahan, pembuatan jalan, dan pekerjaan fondasi.",
          mesin_molen: "Mesin molen (pengaduk beton) digunakan untuk mencampur adukan beton secara merata. Tersedia dalam kapasitas standar untuk proyek skala kecil hingga menengah.",
          catwalk: "Catwalk (pijakan scaffolding) adalah platform kerja yang dipasang pada rangka scaffolding untuk memberikan area berdiri yang aman bagi pekerja.",
          shock: "Joint Pin (Shock) adalah penghubung vertikal yang digunakan untuk mengunci frame scaffolding satu dengan lainnya.",
          u_head: "U Head adalah komponen penopang yang dipasang di atas scaffolding untuk menahan beban balok atau pelat lantai kerja.",
        };

        return (
          <Dialog open={!!selectedEquipDetail} onOpenChange={(open) => { if (!open) setSelectedEquipDetail(null); }}>
            <DialogContent className="card-elevated max-w-lg w-[95vw] p-0 overflow-hidden">
              {/* Header with gradient */}
              <div className={`bg-gradient-to-r ${gradientBg} px-6 py-5 relative`}>
                <DialogHeader className="text-left">
                  <DialogTitle className="text-white text-lg font-bold">
                    {eq.label}
                  </DialogTitle>
                </DialogHeader>
                <Badge className={`absolute top-5 right-14 ${statusColor} border-0 text-xs`}>
                  <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${dotColor}`} />
                  {statusLabel}
                </Badge>
              </div>

              <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {/* Availability Stats */}
                <div className="animate-fade-in-up">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Ketersediaan</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl py-3 px-2 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100 stat-number">{eq.total}</p>
                      <p className="text-[10px] text-gray-400">{eq.unit}</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl py-3 px-2 text-center">
                      <p className="text-xs text-emerald-600">Tersedia</p>
                      <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 stat-number">{eq.tersedia}</p>
                      <p className="text-[10px] text-emerald-500">{eq.unit}</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl py-3 px-2 text-center">
                      <p className="text-xs text-amber-600">Disewa</p>
                      <p className="text-xl font-bold text-amber-700 dark:text-amber-300 stat-number">{eq.disewa}</p>
                      <p className="text-[10px] text-amber-500">{eq.unit}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="animate-fade-in-up">
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                    {eq.disewa > 0 && (
                      <div
                        className="h-full bg-amber-400 progress-bar-animate"
                        style={{ width: `${eq.total > 0 ? (eq.disewa / eq.total) * 100 : 0}%` }}
                      />
                    )}
                    {isPerbaikan && (
                      <div
                        className="h-full bg-orange-400 progress-bar-animate"
                        style={{ width: `${eq.total > 0 ? (eq.perbaikan / eq.total) * 100 : 0}%` }}
                      />
                    )}
                    {eq.tersedia > 0 && (
                      <div
                        className="h-full bg-emerald-500 progress-bar-animate"
                        style={{ width: `${eq.total > 0 ? (eq.tersedia / eq.total) * 100 : 0}%` }}
                      />
                    )}
                  </div>
                  <div className="flex gap-3 mt-1.5">
                    {eq.tersedia > 0 && (
                      <span className="text-[10px] text-emerald-600">■ Tersedia</span>
                    )}
                    {eq.disewa > 0 && (
                      <span className="text-[10px] text-amber-500">■ Disewa</span>
                    )}
                    {isPerbaikan && (
                      <span className="text-[10px] text-orange-500">■ Perbaikan</span>
                    )}
                  </div>
                </div>

                {/* Pricing Section */}
                {eqPrice && (
                  <div className="animate-fade-in-up">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Harga Sewa</p>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-4 py-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-emerald-700 dark:text-emerald-300">Harga per {eqPrice.unit}</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 stat-number">
                          {formatCurrency(eqPrice.price)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {eqPrice.billingType === "bulanan"
                          ? "Hitungan per bulan (1 bulan = 30 hari)"
                          : "Hitungan per hari"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Equipment Info */}
                <div className="animate-fade-in-up">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Informasi Alat</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {descriptions[eq.item] ?? "Peralatan konstruksi berkualitas untuk kebutuhan proyek Anda."}
                  </p>
                </div>

                {/* CTA Button */}
                <a
                  href={`https://wa.me/6281234567890?text=Halo, saya ingin menyewa ${eq.label}. Mohon info ketersediaan.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-11 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all btn-press animate-fade-in-up"
                >
                  <MessageCircle className="w-4 h-4" />
                  Sewa Sekarang via WhatsApp
                </a>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />
    </div>
  );
}
