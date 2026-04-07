"use client";

import { useAppStore } from "@/store/use-store";
import {
  Building2,
  ShieldCheck,
  AlertTriangle,
  Info,
  Phone,
  MapPin,
  Calculator,
  Clock,
  ArrowUp,
  Truck,
  Hammer,
  Boxes,

  CheckCircle2,
  TrendingUp,
  Plus,
  Trash2,
  Layers,
  Link,
  Home,
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

function useAnimatedNumber(target: number, shouldAnimate: boolean, duration = 1000) {
  const [current, setCurrent] = useState(0);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!shouldAnimate) {
      hasAnimatedRef.current = false;
      return;
    }
    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    const end = target;
    const startTime = performance.now();
    let raf: number;
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round((end) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shouldAnimate, target, duration]);

  return current;
}

export function BerandaView() {
  const { setView } = useAppStore();
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [priceData, setPriceData] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [animatedStats, setAnimatedStats] = useState(false);
  const [currentPage, setCurrentPage] = useState<"beranda" | "lokasi" | "alat" | "hitung">("beranda");

  // Animated counting values
  const animatedJenisAlat = useAnimatedNumber(stockData.length, animatedStats, 1000);
  const animatedTersedia = useAnimatedNumber(stockData.reduce((sum, s) => sum + s.tersedia, 0), animatedStats, 1200);
  const animatedPerbaikan = useAnimatedNumber(stockData.filter((s) => s.perbaikan > 0).length, animatedStats, 800);

  // Calculator state - multi equipment
  const [calcItems, setCalcItems] = useState<{ item: string; quantity: number }[]>([]);
  const [duration, setDuration] = useState<number>(1);
  const [showResult, setShowResult] = useState(false);


  // Equipment detail modal state
  const [selectedEquipDetail, setSelectedEquipDetail] = useState<StockItem | null>(null);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Animate hero stats when visible
  useEffect(() => {
    if (!loading && stockData.length > 0) {
      const timer = setTimeout(() => setAnimatedStats(true), 400);
      return () => clearTimeout(timer);
    }
  }, [loading, stockData.length]);

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

  // Calculator helpers
  function addCalcItem() {
    const usedItems = calcItems.map((ci) => ci.item);
    const available = priceData.find((p) => !usedItems.includes(p.item));
    if (available) {
      setCalcItems([...calcItems, { item: available.item, quantity: 1 }]);
      setShowResult(false);
    }
  }

  function removeCalcItem(index: number) {
    setCalcItems(calcItems.filter((_, i) => i !== index));
    setShowResult(false);
  }

  function updateCalcItem(index: number, field: "item" | "quantity", value: string | number) {
    const updated = [...calcItems];
    if (field === "item") {
      // Make sure the new item is not already selected
      const otherItems = calcItems.filter((_, i) => i !== index).map((ci) => ci.item);
      if (otherItems.includes(value as string)) return;
      updated[index].item = value as string;
    } else {
      updated[index].quantity = Math.min(100, Math.max(1, value as number));
    }
    setCalcItems(updated);
    setShowResult(false);
  }

  // Computed results for each item
  function getItemResult(ci: { item: string; quantity: number }) {
    const p = priceData.find((pr) => pr.item === ci.item);
    if (!p) return null;
    const multiplier = p.billingType === "bulanan" ? Math.ceil(duration / 30) : duration;
    const cost = p.price * ci.quantity * multiplier;
    return { priceItem: p, multiplier, cost };
  }

  function handleCalculate() {
    if (calcItems.length === 0) return;
    setShowResult(true);
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Header */}
      <header className="sticky top-0 z-50 animate-fade-in relative transition-all duration-300 bg-mitra-gradient text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2.5 bg-white/20 backdrop-blur-sm">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                MITRA SEWA
              </h1>
              <p className="text-[10px] sm:text-xs flex items-center gap-1.5 text-white/80">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-400" />
                Penyewaan Alat Konstruksi Terpercaya
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAboutOpen(true)}
              className="transition-all text-white/80 hover:text-white hover:bg-white/20"
            >
              <Info className="w-5 h-5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setView("login")}
              className="hidden sm:flex items-center gap-2 transition-all bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-0"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setView("login")}
              className="sm:hidden transition-all text-white hover:bg-white/20"
            >
              <ShieldCheck className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Desktop Navigation Tabs */}
      <nav className="hidden sm:flex items-center justify-center gap-1 bg-white border-b border-gray-100 sticky top-[68px] z-40 no-print">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 w-full">
          {[
            { key: "beranda", label: "Beranda", icon: Home },
            { key: "lokasi", label: "Lokasi", icon: MapPin },
            { key: "alat", label: "Alat", icon: Boxes },
            { key: "hitung", label: "Hitung", icon: Calculator },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCurrentPage(tab.key as typeof currentPage)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all ${
                currentPage === tab.key
                  ? 'text-emerald-700 bg-emerald-50 border-b-2 border-emerald-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Hero Section */}
      {currentPage === "beranda" && (
      <section className="bg-mesh-gradient px-4 py-10 sm:py-16 animate-fade-in relative overflow-hidden z-10">
        {/* Gradient mesh overlay */}
        <div className="hero-mesh-overlay absolute inset-0 z-0" />
        {/* Decorative gear pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
             style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 20 20\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'4\' fill=\'none\' stroke=\'%2310b981\' stroke-width=\'1\'/%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'1.5\' fill=\'%2310b981\'/%3E%3Cline x1=\'10\' y1=\'1\' x2=\'10\' y2=\'5\' stroke=\'%2310b981\' stroke-width=\'1.5\' stroke-linecap=\'round\'/%3E%3Cline x1=\'10\' y1=\'15\' x2=\'10\' y2=\'19\' stroke=\'%2310b981\' stroke-width=\'1.5\' stroke-linecap=\'round\'/%3E%3Cline x1=\'1\' y1=\'10\' x2=\'5\' y2=\'10\' stroke=\'%2310b981\' stroke-width=\'1.5\' stroke-linecap=\'round\'/%3E%3Cline x1=\'15\' y1=\'10\' x2=\'19\' y2=\'10\' stroke=\'%2310b981\' stroke-width=\'1.5\' stroke-linecap=\'round\'/%3E%3C/svg%3E")'}} />

        {/* Floating Bubbles (Hero region) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="bubble bubble-emerald" style={{ left: '8%', top: '60%', width: '28px', height: '28px', animationDelay: '0s', animationDuration: '7s' }} />
          <div className="bubble bubble-teal" style={{ left: '22%', top: '70%', width: '18px', height: '18px', animationDelay: '1.5s', animationDuration: '9s' }} />
          <div className="bubble bubble-green" style={{ left: '38%', top: '55%', width: '36px', height: '36px', animationDelay: '0.5s', animationDuration: '6s' }} />
          <div className="bubble bubble-lime" style={{ left: '52%', top: '75%', width: '14px', height: '14px', animationDelay: '2s', animationDuration: '10s' }} />
          <div className="bubble bubble-cyan" style={{ left: '68%', top: '65%', width: '22px', height: '22px', animationDelay: '3s', animationDuration: '8s' }} />
          <div className="bubble bubble-emerald" style={{ left: '82%', top: '58%', width: '32px', height: '32px', animationDelay: '1s', animationDuration: '7.5s' }} />
          <div className="bubble bubble-teal" style={{ left: '92%', top: '72%', width: '16px', height: '16px', animationDelay: '4s', animationDuration: '11s' }} />
          <div className="bubble bubble-green" style={{ left: '45%', top: '80%', width: '10px', height: '10px', animationDelay: '2.5s', animationDuration: '6.5s' }} />
        </div>

        <div className="relative overflow-hidden rounded-2xl">
          <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-medium mb-4 animate-fade-in-up">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-green" />
            Tersedia untuk disewa
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 animate-fade-in-up animate-fade-in-up-delay-1">
            Solusi Alat Konstruksi
            {" "}<span className="text-shimmer inline-block">Terlengkap</span>
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
                  {animatedJenisAlat}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Jenis Alat</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center hover-lift rounded-xl px-4 py-2">
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600 stat-number">
                  {animatedTersedia}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Unit Tersedia</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center hover-lift rounded-xl px-4 py-2">
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600 stat-number">
                  {animatedPerbaikan}
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
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 pb-20 sm:pb-4 space-y-3 relative z-10">
        {/* Tentang Kami Summary */}
        {currentPage === "beranda" && (
        <section>
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 sm:p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl mb-3">
              <Building2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Mitra Terpercaya untuk Kebutuhan Konstruksi Anda</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
              MITRA SEWA menyediakan berbagai peralatan konstruksi berkualitas dengan harga terjangkau. Melayani area Bojonegoro dan sekitarnya.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full font-medium">
                <Clock className="w-3 h-3" /> 5+ Tahun Pengalaman
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full font-medium">
                <Hammer className="w-3 h-3" /> 500+ Proyek
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full font-medium">
                <ShieldCheck className="w-3 h-3" /> 100+ Pelanggan
              </span>
            </div>
          </div>
        </section>
        )}

        {/* Lokasi Page - Google Maps */}
        {currentPage === "lokasi" && (
        <section className="animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900">Lokasi Kami</h3>
          </div>
          <Card className="border-0 shadow-md bg-white overflow-hidden card-elevated">
            <CardContent className="p-0">
              <div className="bg-mitra-gradient px-5 py-4 flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm sm:text-base">MITRA SEWA</p>
                  <p className="text-white/70 text-xs">Gedung Pusat Penggerak Ekonomi BMT NU Ngasem Group</p>
                </div>
              </div>
              <div className="p-4 sm:p-5 space-y-4">
                <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3959.123456789!2d111.883333!3d-7.175!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zN8KwMTAnMzAuMCJTIDExMcKwNTMnMDAuMCJF!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid"
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full"
                    title="Lokasi MITRA SEWA"
                  />
                </div>
                <div className="space-y-3">
                  <a
                    href="https://maps.app.goo.gl/Tb1t8nXyeQxy957R9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all btn-press btn-emerald-gradient"
                  >
                    <MapPin className="w-4 h-4" />
                    Buka di Google Maps
                  </a>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Telepon / WhatsApp</p>
                        <a href="https://wa.me/6285185924243" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gray-900 hover:text-emerald-600 transition-colors">
                          0851-8592-4243
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Jam Operasional</p>
                        <p className="text-sm font-semibold text-gray-900">07.00 – 17.00 WIB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
        )}

        {/* Scaffolding Stats */}
        {currentPage === "alat" && (
        <section
          className="border-b border-gray-100 pb-4 pt-4"
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
              <Card className="border-0 shadow-md card-shine animate-fade-in-up" style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)' }}>
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
              <Card className="border-0 shadow-md card-shine animate-fade-in-up animate-fade-in-up-delay-1 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' }}>
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-700 mb-1">
                    Tersedia
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-600 animate-count-up stat-number">
                    {scaffolding?.tersedia ?? 0}
                  </p>
                  <p className="text-xs text-emerald-500 mt-1">set</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md card-shine animate-fade-in-up animate-fade-in-up-delay-2" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
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
        )}

        {/* Equipment Status */}
        {currentPage === "alat" && (
        <section
          className="border-b border-gray-100 pb-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900">Status Alat</h3>
          </div>

          {/* Equipment availability summary */}
          {!loading && (
            <div className="flex flex-wrap gap-2 mb-4">
              {machines.map((m) => (
                <Badge key={m.item} variant="outline" className="text-xs px-3 py-1.5 border-gray-200">
                  <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${m.tersedia > 0 ? "bg-emerald-500" : m.tersedia <= 0 ? "bg-red-500" : "bg-gray-400"}`} />
                  {m.label}: <span className="font-bold">{m.tersedia}</span>/{m.total} {m.unit}
                </Badge>
              ))}
            </div>
          )}

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
                            className="h-full bg-amber-400"
                            style={{ width: `${machine.total > 0 ? (machine.disewa / machine.total) * 100 : 0}%` }}
                          />
                        )}
                        {isPerbaikan && (
                          <div
                            className="h-full bg-red-400"
                            style={{ width: `${machine.total > 0 ? (machine.perbaikan / machine.total) * 100 : 0}%` }}
                          />
                        )}
                        {machine.tersedia > 0 && (
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${machine.total > 0 ? (machine.tersedia / machine.total) * 100 : 0}%` }}
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
                          <span className="text-[10px] text-red-500">
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

          {/* Equipment Quick Compare Table */}
          {!loading && (
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600">Alat</th>
                      <th className="text-center px-3 py-2.5 font-medium text-gray-600">Total</th>
                      <th className="text-center px-3 py-2.5 font-medium text-gray-600">Tersedia</th>
                      <th className="text-center px-3 py-2.5 font-medium text-gray-600">Disewa</th>
                      <th className="text-center px-3 py-2.5 font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Scaffolding row */}
                    {scaffolding && (
                      <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-gray-900">{scaffolding.label}</td>
                        <td className="text-center px-3 py-2.5 text-gray-700">{scaffolding.total}</td>
                        <td className="text-center px-3 py-2.5 text-emerald-600 font-semibold">{scaffolding.tersedia}</td>
                        <td className="text-center px-3 py-2.5 text-amber-600">{scaffolding.disewa}</td>
                        <td className="text-center px-3 py-2.5">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                            scaffolding.tersedia > 0
                              ? 'bg-emerald-100 text-emerald-700'
                              : scaffolding.perbaikan > 0
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-red-100 text-red-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              scaffolding.tersedia > 0
                                ? 'bg-emerald-500'
                                : scaffolding.perbaikan > 0
                                  ? 'bg-orange-500'
                                  : 'bg-red-500'
                            }`} />
                            {scaffolding.tersedia > 0 ? 'Tersedia' : scaffolding.perbaikan > 0 ? 'Perbaikan' : 'Habis'}
                          </span>
                        </td>
                      </tr>
                    )}
                    {/* Machine rows */}
                    {machines.map((m) => (
                      <tr key={m.item} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-gray-900">{m.label}</td>
                        <td className="text-center px-3 py-2.5 text-gray-700">{m.total}</td>
                        <td className="text-center px-3 py-2.5 text-emerald-600 font-semibold">{m.tersedia}</td>
                        <td className="text-center px-3 py-2.5 text-amber-600">{m.disewa}</td>
                        <td className="text-center px-3 py-2.5">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                            m.tersedia > 0
                              ? 'bg-emerald-100 text-emerald-700'
                              : m.perbaikan > 0
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-red-100 text-red-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              m.tersedia > 0
                                ? 'bg-emerald-500'
                                : m.perbaikan > 0
                                  ? 'bg-orange-500'
                                  : 'bg-red-500'
                            }`} />
                            {m.tersedia > 0 ? 'Tersedia' : m.perbaikan > 0 ? 'Perbaikan' : 'Habis'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* Komponen rows */}
                    {komponen.map((k) => (
                      <tr key={k.item} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-gray-900">{k.label}</td>
                        <td className="text-center px-3 py-2.5 text-gray-700">{k.total}</td>
                        <td className="text-center px-3 py-2.5 text-emerald-600 font-semibold">{k.tersedia}</td>
                        <td className="text-center px-3 py-2.5 text-amber-600">{k.disewa}</td>
                        <td className="text-center px-3 py-2.5">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                            k.tersedia > 0
                              ? 'bg-emerald-100 text-emerald-700'
                              : k.perbaikan > 0
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-red-100 text-red-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              k.tersedia > 0
                                ? 'bg-emerald-500'
                                : k.perbaikan > 0
                                  ? 'bg-orange-500'
                                  : 'bg-red-500'
                            }`} />
                            {k.tersedia > 0 ? 'Tersedia' : k.perbaikan > 0 ? 'Perbaikan' : 'Habis'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
        )}

        {/* Layanan Kami */}
        {currentPage === "beranda" && (
        <section
          className="border-b border-gray-100 pb-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900">Layanan Kami</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Sewa Scaffolding */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center card-shine hover-lift">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' }}>
                <Boxes className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">Sewa Scaffolding</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">Set lengkap scaffolding berkualitas tinggi untuk proyek konstruksi bertingkat</p>
            </div>
            {/* Sewa Mesin */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center card-shine hover-lift">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
                <Hammer className="w-5 h-5 text-amber-600" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">Sewa Mesin</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">Mesin molen & mesin stamper untuk kebutuhan pengecoran</p>
            </div>
            {/* Pengiriman & Pemasangan */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center card-shine hover-lift">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3" style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)' }}>
                <Truck className="w-5 h-5 text-teal-600" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">Pengiriman Alat</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">Pengiriman alat ke lokasi proyek area Bojonegoro dan sekitarnya</p>
            </div>
            {/* Konsultasi Gratis */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center card-shine hover-lift">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }}>
                <Phone className="w-5 h-5 text-violet-600" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">Konsultasi Gratis</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">Konsultasi kebutuhan alat konstruksi via WhatsApp</p>
            </div>
          </div>
        </section>
        )}

        {/* Komponen Scaffolding */}
        {currentPage === "alat" && (
        <section
          className="border-b border-gray-100 pb-4"
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
                const accentColor = item.item === "catwalk" ? "border-l-emerald-500" : item.item === "shock" ? "border-l-teal-500" : "border-l-cyan-500";
                const accentIcon = item.item === "catwalk" ? <Layers className="w-4 h-4 text-emerald-500" /> : item.item === "shock" ? <Link className="w-4 h-4 text-teal-500" /> : <ArrowUp className="w-4 h-4 text-cyan-500" />;

                return (
                  <Card
                    key={item.item}
                    className={`border-0 border-l-4 ${accentColor} shadow-md bg-white overflow-hidden card-elevated cursor-pointer ${
                      isPerbaikan ? "ring-1 ring-orange-200" : ""
                    }`}
                    onClick={() => handleEquipmentClick(item)}
                  >
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                          {accentIcon}
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
        )}

        {/* ===== Kalkulator Biaya Sewa ===== */}
        {currentPage === "hitung" && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900">
              Kalkulator Biaya Sewa
            </h3>
          </div>
          <Card className="border-0 shadow-md bg-white overflow-hidden card-elevated">
            {/* Emerald gradient header */}
            <div className="bg-mitra-gradient calc-header-pattern px-5 sm:px-6 py-4 flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm sm:text-base">
                  Hitung Estimasi Biaya Sewa
                </p>
                <p className="text-white/70 text-xs">
                  Pilih beberapa alat dan hitung perkiraan biaya penyewaan
                </p>
              </div>
            </div>
            <CardContent className="p-5 sm:p-6 space-y-4">
              {/* Multi equipment rows */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  Daftar Alat yang Disewa
                </Label>
                {priceData.length > 0 ? (
                  <>
                    {calcItems.map((ci, idx) => {
                      const p = priceData.find((pr) => pr.item === ci.item);
                      return (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="flex-1 space-y-1">
                            {idx === 0 && <span className="text-[10px] text-gray-400 block">Jenis Alat</span>}
                            <Select
                              value={ci.item}
                              onValueChange={(val) => updateCalcItem(idx, "item", val)}
                            >
                              <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Pilih alat..." />
                              </SelectTrigger>
                              <SelectContent>
                                {priceData.map((pr) => {
                                  const usedByOther = calcItems.some((c, i) => i !== idx && c.item === pr.item);
                                  return (
                                    <SelectItem key={pr.item} value={pr.item} disabled={usedByOther}>
                                      {pr.label} {usedByOther ? "(dipilih)" : ""}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            {p && (
                              <p className="text-[10px] text-emerald-600">
                                {formatCurrency(p.price)} / {p.billingType === "bulanan" ? "bulan" : "hari"} per {p.unit}
                              </p>
                            )}
                          </div>
                          <div className="w-24 space-y-1">
                            {idx === 0 && <span className="text-[10px] text-gray-400 block">Jumlah</span>}
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              value={ci.quantity}
                              onChange={(e) => updateCalcItem(idx, "quantity", Number(e.target.value) || 1)}
                              className="h-10"
                            />
                          </div>
                          {calcItems.length > 1 && (
                            <button
                              onClick={() => removeCalcItem(idx)}
                              className="mt-6 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus alat"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {/* Add item button */}
                    {calcItems.length < priceData.length && (
                      <button
                        onClick={addCalcItem}
                        className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-2 rounded-lg transition-colors w-full justify-center border border-dashed border-emerald-300 btn-dashed-pulse"
                      >
                        <Plus className="w-4 h-4" />
                        Tambah Alat Lainnya
                      </button>
                    )}
                  </>
                ) : (
                  <Skeleton className="h-10 w-full rounded-md" />
                )}
              </div>

              {/* Duration input */}
              <div className="space-y-2">
                <Label
                  htmlFor="calc-days"
                  className="text-sm font-medium text-gray-700"
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

              {/* Divider between inputs and results */}
              <div className="border-t border-gray-100" />

              {/* Calculate button */}
              <Button
                onClick={handleCalculate}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold btn-press transition-all btn-emerald-gradient"
                disabled={calcItems.length === 0}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Hitung Estimasi ({calcItems.length} alat)
              </Button>

              {/* Result card */}
              {showResult && (
                (() => {
                  const results = calcItems.map((ci) => getItemResult(ci)).filter(Boolean) as { priceItem: typeof priceData[0]; multiplier: number; cost: number }[];
                  const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
                  return (
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl overflow-hidden animate-fade-in-up">
                      {/* Success header */}
                      <div className="bg-mitra-gradient px-5 py-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                        <p className="text-white font-semibold text-sm">Estimasi Biaya Sewa</p>
                      </div>
                      <div className="p-5">
                        {/* Total */}
                        <div className="text-center mb-4">
                          <p className="text-xs text-gray-500 mb-1">Total Estimasi</p>
                          <p className="text-2xl sm:text-3xl font-bold text-emerald-700 stat-number">
                            {formatCurrency(totalCost)}
                          </p>
                        </div>
                        {/* Per-item breakdown */}
                        <div className="bg-white/60 rounded-lg p-3 space-y-3 mb-4">
                          {results.map((r, idx) => (
                            <div key={idx}>
                              <div className="flex justify-between text-xs font-medium text-gray-900 mb-1">
                                <span>{r.priceItem.label}</span>
                                <span className="text-emerald-700">{formatCurrency(r.cost)}</span>
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-400">
                                <span>{calcItems[idx].quantity} {r.priceItem.unit} × {formatCurrency(r.priceItem.price)} / {r.priceItem.billingType === "bulanan" ? "bulan" : "hari"}</span>
                                <span>× {r.multiplier} {r.priceItem.billingType === "bulanan" ? "bulan" : "hari"}</span>
                              </div>
                              {idx < results.length - 1 && <div className="border-t border-emerald-100 mt-2 pt-2" />}
                            </div>
                          ))}
                          <div className="border-t border-emerald-200 pt-2 flex justify-between text-xs font-semibold">
                            <span className="text-gray-700">Durasi Total</span>
                            <span className="text-gray-900">{duration} hari</span>
                          </div>
                        </div>
                        {/* WhatsApp CTA */}
                        <a
                          href={`https://wa.me/6285185924243?text=${encodeURIComponent(
                            `Halo MITRA SEWA, saya ingin menyewa:\n\n${results.map((r, idx) => `${idx + 1}. ${r.priceItem.label} (${calcItems[idx].quantity} ${r.priceItem.unit})`).join("\n")}\n\nDurasi: ${duration} hari\nTotal estimasi: ${formatCurrency(totalCost)}\n\nApakah tersedia?`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full h-11 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-xl transition-all btn-press"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Pesan via WhatsApp
                        </a>
                        <Badge className="mt-3 bg-emerald-200/80 text-emerald-800 border-0 text-[10px] flex justify-center w-fit mx-auto">
                          *Estimasi, harga dapat berubah sewaktu-waktu
                        </Badge>
                      </div>
                    </div>
                  );
                })()
              )}
            </CardContent>
          </Card>
        </section>
        )}
      </main>

      {/* Full-Page Floating Bubbles Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Left column bubbles */}
        <div className="bubble bubble-emerald" style={{ left: '3%', bottom: '-30px', width: '24px', height: '24px', animationDelay: '0s', animationDuration: '12s' }} />
        <div className="bubble bubble-teal" style={{ left: '7%', bottom: '-20px', width: '40px', height: '40px', animationDelay: '3s', animationDuration: '14s' }} />
        <div className="bubble bubble-lime" style={{ left: '12%', bottom: '-40px', width: '16px', height: '16px', animationDelay: '6s', animationDuration: '11s' }} />
        <div className="bubble bubble-cyan" style={{ left: '5%', bottom: '-15px', width: '30px', height: '30px', animationDelay: '8s', animationDuration: '13s' }} />
        {/* Center-left bubbles */}
        <div className="bubble bubble-green" style={{ left: '20%', bottom: '-25px', width: '20px', height: '20px', animationDelay: '1s', animationDuration: '10s' }} />
        <div className="bubble bubble-emerald" style={{ left: '28%', bottom: '-50px', width: '36px', height: '36px', animationDelay: '5s', animationDuration: '15s' }} />
        {/* Center bubbles */}
        <div className="bubble bubble-teal" style={{ left: '42%', bottom: '-35px', width: '28px', height: '28px', animationDelay: '2s', animationDuration: '13s' }} />
        <div className="bubble bubble-lime" style={{ left: '50%', bottom: '-20px', width: '12px', height: '12px', animationDelay: '7s', animationDuration: '11s' }} />
        <div className="bubble bubble-cyan" style={{ left: '55%', bottom: '-45px', width: '34px', height: '34px', animationDelay: '4s', animationDuration: '14s' }} />
        {/* Center-right bubbles */}
        <div className="bubble bubble-green" style={{ left: '65%', bottom: '-30px', width: '22px', height: '22px', animationDelay: '9s', animationDuration: '12s' }} />
        <div className="bubble bubble-emerald" style={{ left: '72%', bottom: '-15px', width: '38px', height: '38px', animationDelay: '1.5s', animationDuration: '16s' }} />
        {/* Right column bubbles */}
        <div className="bubble bubble-teal" style={{ left: '80%', bottom: '-40px', width: '18px', height: '18px', animationDelay: '6.5s', animationDuration: '11s' }} />
        <div className="bubble bubble-lime" style={{ left: '88%', bottom: '-25px', width: '26px', height: '26px', animationDelay: '3.5s', animationDuration: '13s' }} />
        <div className="bubble bubble-cyan" style={{ left: '93%', bottom: '-35px', width: '14px', height: '14px', animationDelay: '10s', animationDuration: '12s' }} />
        <div className="bubble bubble-green" style={{ left: '97%', bottom: '-20px', width: '32px', height: '32px', animationDelay: '0.5s', animationDuration: '15s' }} />
      </div>



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
            <DialogContent aria-describedby={undefined} className="card-elevated max-w-lg w-[95vw] p-0 overflow-hidden">
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
                    <div className="bg-gray-50 rounded-xl py-3 px-2 text-center">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-xl font-bold text-gray-900 stat-number">{eq.total}</p>
                      <p className="text-[10px] text-gray-400">{eq.unit}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl py-3 px-2 text-center">
                      <p className="text-xs text-emerald-600">Tersedia</p>
                      <p className="text-xl font-bold text-emerald-700 stat-number">{eq.tersedia}</p>
                      <p className="text-[10px] text-emerald-500">{eq.unit}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl py-3 px-2 text-center">
                      <p className="text-xs text-amber-600">Disewa</p>
                      <p className="text-xl font-bold text-amber-700 stat-number">{eq.disewa}</p>
                      <p className="text-[10px] text-amber-500">{eq.unit}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="animate-fade-in-up">
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                    {eq.disewa > 0 && (
                      <div
                        className="h-full bg-amber-400 progress-bar-animate"
                        style={{ width: `${eq.total > 0 ? (eq.disewa / eq.total) * 100 : 0}%` }}
                      />
                    )}
                    {isPerbaikan && (
                      <div
                        className="h-full bg-red-400 progress-bar-animate"
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
                    <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl px-4 py-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-emerald-700">Harga per {eqPrice.unit}</span>
                        <span className="text-sm font-bold text-emerald-600 stat-number">
                          {formatCurrency(eqPrice.price)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">
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
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {descriptions[eq.item] ?? "Peralatan konstruksi berkualitas untuk kebutuhan proyek Anda."}
                  </p>
                </div>

                {/* CTA Button */}
                <a
                  href={`https://wa.me/6285185924243?text=${encodeURIComponent(`Halo, saya tertarik untuk menyewa ${eq.label}. Apakah tersedia?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-11 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-xl transition-all btn-press animate-fade-in-up"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Hubungi via WhatsApp
                </a>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden mobile-bottom-nav no-print">
        <div className="flex items-center justify-around py-1.5 px-2 max-w-lg mx-auto">
          <button
            onClick={() => setCurrentPage("beranda")}
            className={`mobile-bottom-nav-item ${currentPage === "beranda" ? 'active' : ''}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium" style={{ minWidth: '64px', textAlign: 'center' }}>Beranda</span>
          </button>
          <button
            onClick={() => setCurrentPage("lokasi")}
            className={`mobile-bottom-nav-item ${currentPage === "lokasi" ? 'active' : ''}`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[10px] font-medium" style={{ minWidth: '64px', textAlign: 'center' }}>Lokasi</span>
          </button>
          <button
            onClick={() => setCurrentPage("alat")}
            className={`mobile-bottom-nav-item ${currentPage === "alat" ? 'active' : ''}`}
          >
            <Boxes className="w-5 h-5" />
            <span className="text-[10px] font-medium" style={{ minWidth: '64px', textAlign: 'center' }}>Alat</span>
          </button>
          <button
            onClick={() => setCurrentPage("hitung")}
            className={`mobile-bottom-nav-item ${currentPage === "hitung" ? 'active' : ''}`}
          >
            <Calculator className="w-5 h-5" />
            <span className="text-[10px] font-medium" style={{ minWidth: '64px', textAlign: 'center' }}>Hitung</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
