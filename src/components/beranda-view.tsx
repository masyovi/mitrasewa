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
  Instagram,
  Facebook,
  ClipboardList,
  CheckCircle2,
  TrendingUp,
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
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [animatedStats, setAnimatedStats] = useState(false);

  // Animated counting values
  const animatedJenisAlat = useAnimatedNumber(stockData.length, animatedStats, 1000);
  const animatedTersedia = useAnimatedNumber(stockData.reduce((sum, s) => sum + s.tersedia, 0), animatedStats, 1200);
  const animatedPerbaikan = useAnimatedNumber(stockData.filter((s) => s.perbaikan > 0).length, animatedStats, 800);

  // Calculator state
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [duration, setDuration] = useState<number>(1);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);


  // Equipment detail modal state
  const [selectedEquipDetail, setSelectedEquipDetail] = useState<StockItem | null>(null);

  // Scroll reveal refs
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

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

  // Scroll to top visibility
  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 600);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="bg-mitra-gradient text-white sticky top-0 z-50 shadow-lg animate-fade-in relative">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2.5">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                MITRA SEWA
              </h1>
              <p className="text-xs sm:text-sm text-white/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Penyewaan Alat Konstruksi Terpercaya
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
      <section className="bg-mesh-gradient px-4 py-10 sm:py-16 animate-fade-in relative overflow-hidden z-10">
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

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 space-y-3 relative z-10">
        {/* ===== Tentang Kami Summary Section ===== */}
        <section className="reveal border-b border-gray-100 pb-4">
          <div className="text-center max-w-2xl mx-auto">
            <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Mitra Terpercaya untuk Kebutuhan Konstruksi Anda
            </h3>
            <p className="text-sm sm:text-base text-gray-500 leading-relaxed mb-5">
              MITRA SEWA hadir sebagai solusi penyewaan alat konstruksi di Bojonegoro dan sekitarnya. Dengan peralatan berkualitas dan harga kompetitif, kami siap mendukung kesuksesan proyek Anda.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-100">
                <Clock className="w-3.5 h-3.5" />
                5+ Tahun Pengalaman
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-100">
                <Hammer className="w-3.5 h-3.5" />
                500+ Proyek
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-100">
                <ShieldCheck className="w-3.5 h-3.5" />
                100+ Pelanggan
              </span>
            </div>
          </div>
        </section>

        {/* ===== Cara Pemesanan Step-by-Step Section ===== */}
        <section className="reveal">
          <div className="text-center mb-6">
            <div className="flex items-center gap-2 mb-4 justify-center">
              <div className="w-1 h-6 bg-emerald-500 rounded-full" />
              <h3 className="text-lg font-bold text-gray-900">Cara Pemesanan</h3>
            </div>
            <p className="text-sm text-gray-500">Proses penyewaan alat konstruksi yang mudah dan cepat</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative">
            {/* Dotted connector line (desktop only) */}
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] border-t-2 border-dashed border-emerald-200" />
            {[
              { icon: Phone, title: "Hubungi Kami", desc: "Hubungi via WhatsApp atau telepon untuk konsultasi" },
              { icon: ClipboardList, title: "Pilih Alat", desc: "Pilih alat konstruksi sesuai kebutuhan proyek" },
              { icon: Truck, title: "Pengiriman", desc: "Kami antar alat langsung ke lokasi proyek Anda" },
              { icon: CheckCircle2, title: "Mulai Sewa", desc: "Alat siap digunakan, tinggal bayar sewa" },
            ].map((step, idx) => (
              <div key={idx} className="relative flex flex-col items-center text-center group">
                {/* Step number circle */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center text-lg sm:text-xl font-bold shadow-lg shadow-emerald-200 mb-3 group-hover:scale-110 transition-transform relative z-10">
                  {idx + 1}
                </div>
                <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1">{step.title}</h4>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-[180px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scaffolding Stats */}
        <section
          ref={(el) => { sectionRefs.current[0] = el; }}
          className="reveal border-b border-gray-100 pb-4 pt-4"
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

        {/* Equipment Status */}
        <section
          ref={(el) => { sectionRefs.current[1] = el; }}
          className="reveal border-b border-gray-100 pb-4"
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
                            className="h-full bg-amber-400 progress-animate"
                            style={{
                              '--progress-width': `${machine.total > 0 ? (machine.disewa / machine.total) * 100 : 0}%`,
                            } as React.CSSProperties}
                          />
                        )}
                        {isPerbaikan && (
                          <div
                            className="h-full bg-orange-400 progress-animate"
                            style={{
                              '--progress-width': `${machine.total > 0 ? (machine.perbaikan / machine.total) * 100 : 0}%`,
                            } as React.CSSProperties}
                          />
                        )}
                        {machine.tersedia > 0 && (
                          <div
                            className="h-full bg-emerald-500 progress-animate"
                            style={{
                              '--progress-width': `${machine.total > 0 ? (machine.tersedia / machine.total) * 100 : 0}%`,
                            } as React.CSSProperties}
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
          className="reveal border-b border-gray-100 pb-4"
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

        {/* ===== Kalkulator Biaya Sewa ===== */}
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
                <Label className="text-sm font-medium text-gray-700">
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
                <div className="bg-emerald-50 rounded-lg px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm text-emerald-700">
                    Harga per {selectedPriceItem.unit}
                  </span>
                  <span className="text-sm font-bold text-emerald-600 stat-number">
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
                    className="text-sm font-medium text-gray-700"
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
              </div>

              {/* Billing info */}
              {selectedPriceItem && (
                <p className="text-xs text-gray-400">
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
              {showResult && estimatedCost !== null && selectedPriceItem && (
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl overflow-hidden animate-fade-in-up">
                  {/* Success header */}
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <p className="text-white font-semibold text-sm">Estimasi Biaya Sewa</p>
                  </div>
                  <div className="p-5">
                    {/* Total */}
                    <div className="text-center mb-4">
                      <p className="text-2xl sm:text-3xl font-bold text-emerald-700 stat-number">
                        {formatCurrency(estimatedCost)}
                      </p>
                    </div>
                    {/* Breakdown */}
                    <div className="bg-white/60 rounded-lg p-3 space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Nama Alat</span>
                        <span className="font-medium text-gray-900">{selectedPriceItem.label}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Jumlah</span>
                        <span className="font-medium text-gray-900">{quantity} {selectedPriceItem.unit}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Durasi</span>
                        <span className="font-medium text-gray-900">{duration} hari{selectedPriceItem.billingType === "bulanan" ? ` (${Math.ceil(duration / 30)} bulan)` : ""}</span>
                      </div>
                      <div className="border-t border-emerald-100 pt-2 flex justify-between text-xs">
                        <span className="text-gray-500">Harga per {selectedPriceItem.unit}</span>
                        <span className="font-medium text-gray-900">{formatCurrency(selectedPriceItem.price)}</span>
                      </div>
                    </div>
                    {/* WhatsApp CTA */}
                    <a
                      href={`https://wa.me/6285185924243?text=${encodeURIComponent(`Halo MITRA SEWA, saya ingin menyewa:\n\nAlat: ${selectedPriceItem.label}\nJumlah: ${quantity} ${selectedPriceItem.unit}\nDurasi: ${duration} hari\n\nEstimasi biaya: ${formatCurrency(estimatedCost)}\n\nApakah tersedia?`)}`}
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
              )}
            </CardContent>
          </Card>
        </section>

        {/* ===== Lokasi Kami ===== */}
        <section className="reveal border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900">Lokasi Kami</h3>
          </div>
          <Card className="border-0 shadow-md bg-white overflow-hidden card-elevated">
            <CardContent className="p-0">
              {/* Google Maps embed */}
              <div className="w-full h-56 sm:h-64 overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3955.8!2d111.876!3d-7.1529!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e78422c0e1b18d%3A0x2e7841a1b1b18d1c!2s7.1529%3A111.8787!5e0!3m2!1sid!2s0x2e78422c0e1b18d%3A0x2e7841a1b1b18d1c!4v1722000000000!5m2!1sid!2s0x2e78422c0e1b18d%3A0x2e7841a1b1b18d1c"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Lokasi MITRA SEWA"
                />
              </div>
              {/* Address card */}
              <div className="p-5 flex items-start gap-3 sm:items-center bg-gradient-to-r from-emerald-50/50 to-white">
                <div className="bg-emerald-100 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">
                    MITRA SEWA — Kantor Pusat
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 leading-relaxed">
                    Gedung Pusat Penggerak Ekonomi BMT NU Ngasem Group, Bojonegoro
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                    Area layanan: Bojonegoro dan sekitarnya
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-5 right-5 z-50 bg-white border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-gray-500 rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:shadow-lg transition-all no-print ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        aria-label="Kembali ke atas"
      >
        <ArrowUp className="w-4 h-4" />
      </button>

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

      {/* Footer */}
      <footer className="bg-mitra-gradient text-white mt-auto no-print pb-safe relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Brand Column */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">MITRA SEWA</span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                Penyewaan alat konstruksi terpercaya. Menyediakan scaffolding, mesin molen, mesin stamper, dan berbagai komponen konstruksi berkualitas.
              </p>
              {/* Social Media Links */}
              <div className="flex items-center gap-2 mt-4">
                <a href="https://wa.me/6285185924243" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-all hover:scale-110" aria-label="WhatsApp">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-all hover:scale-110" aria-label="Instagram">
                  <Instagram className="w-3.5 h-3.5 text-white" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-all hover:scale-110" aria-label="Facebook">
                  <Facebook className="w-3.5 h-3.5 text-white" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-sm mb-3 text-white/90">Layanan Kami</h4>
              <ul className="space-y-2">
                <li><span className="text-xs text-white/60 hover:text-white/90 transition-colors cursor-pointer flex items-center gap-1.5"><Boxes className="w-3.5 h-3.5" />Sewa Scaffolding</span></li>
                <li><span className="text-xs text-white/60 hover:text-white/90 transition-colors cursor-pointer flex items-center gap-1.5"><Hammer className="w-3.5 h-3.5" />Sewa Mesin Konstruksi</span></li>
                <li><span className="text-xs text-white/60 hover:text-white/90 transition-colors cursor-pointer flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" />Pengiriman Alat</span></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold text-sm mb-3 text-white/90">Hubungi Kami</h4>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2">
                  <Phone className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-300" />
                  <a href="https://wa.me/6285185924243" target="_blank" rel="noopener noreferrer" className="text-xs text-white/60 hover:text-white transition-colors">0851-8592-4243</a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-300" />
                  <span className="text-xs text-white/60">Gedung Pusat Penggerak Ekonomi BMT NU Ngasem Group</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-300" />
                  <span className="text-xs text-white/60">Buka Setiap Hari 07.00 – 17.00 WIB</span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div>
              <h4 className="font-semibold text-sm mb-3 text-white/90">Butuh Alat Sekarang?</h4>
              <p className="text-xs text-white/60 mb-3 leading-relaxed">
                Hubungi kami via WhatsApp untuk konsultasi gratis dan penawaran terbaik.
              </p>
              <a
                href="https://wa.me/6285185924243?text=Halo, saya ingin bertanya tentang penyewaan alat."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-xs px-5 py-2.5 rounded-xl transition-all footer-cta-glow"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat WhatsApp
              </a>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/15 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/50">
              &copy; {new Date().getFullYear()} MITRA SEWA. All rights reserved.
            </p>
            <p className="text-xs text-white/40">
              Didukung oleh <span className="text-white/60">BMT NU Ngasem Group</span>
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
                    <div className="bg-emerald-50 rounded-xl py-3 px-2 text-center">
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
                    <div className="bg-emerald-50 rounded-xl px-4 py-3 space-y-1.5">
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
    </div>
  );
}
