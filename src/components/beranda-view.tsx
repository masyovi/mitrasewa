"use client";

import { useAppStore } from "@/store/use-store";
import { useTheme } from "next-themes";
import { Building2, ShieldCheck, AlertTriangle, Info, Phone, MapPin, MessageCircle, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { AboutModal } from "@/components/about-modal";

interface StockItem {
  item: string;
  label: string;
  unit: string;
  total: number;
  disewa: number;
  perbaikan: number;
  tersedia: number;
}

export function BerandaView() {
  const { setView } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchStock() {
      try {
        const res = await fetch("/api/stock");
        const json = await res.json();
        if (json.success) {
          setStockData(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch stock:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStock();
  }, []);

  const scaffolding = stockData.find((s) => s.item === "scaffolding");
  const machines = stockData.filter(
    (s) => s.item === "mesin_stamper" || s.item === "mesin_molen"
  );
  const komponen = stockData.filter(
    (s) => s.item === "shock" || s.item === "u_head" || s.item === "catwalk"
  );

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
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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
      <section className="bg-mesh-gradient hero-pattern px-4 py-10 sm:py-16 animate-fade-in">
        <div className="max-w-6xl mx-auto text-center">
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
                  {stockData.filter(s => s.perbaikan > 0).length}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Dalam Perbaikan</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Scaffolding Stats */}
        <section className="animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900">
              Scaffolding
            </h3>
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
        <section className="animate-fade-in-up animate-fade-in-up-delay-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900">
              Status Alat
            </h3>
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
                    className="border-0 shadow-md bg-white overflow-hidden card-elevated"
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
                          <span className="text-[10px] text-emerald-600">■ Tersedia</span>
                        )}
                        {machine.disewa > 0 && (
                          <span className="text-[10px] text-amber-500">■ Disewa</span>
                        )}
                        {isPerbaikan && (
                          <span className="text-[10px] text-orange-500">■ Perbaikan</span>
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
        <section className="animate-fade-in-up animate-fade-in-up-delay-2">
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
                    className={`border-0 shadow-md bg-white overflow-hidden card-elevated ${
                      isPerbaikan ? "ring-1 ring-orange-200" : ""
                    }`}
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
        <section className="animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900">
              Hubungi Kami
            </h3>
          </div>
          <Card className="border-0 shadow-md bg-white overflow-hidden card-elevated">
            <CardContent className="p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 hover-lift rounded-xl p-2 -m-2">
                  <div className="bg-emerald-100 p-2.5 rounded-xl flex-shrink-0">
                    <Phone className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Telepon / WhatsApp</p>
                    <p className="text-sm text-gray-500 mt-0.5">Hubungi kami untuk informasi harga & ketersediaan alat</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 hover-lift rounded-xl p-2 -m-2">
                  <div className="bg-emerald-100 p-2.5 rounded-xl flex-shrink-0">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Lokasi</p>
                    <p className="text-sm text-gray-500 mt-0.5">Pengelola Gedung Pusat BMT NU Ngasem Group</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-3.5 shadow-lg hover:shadow-xl transition-all animate-float no-print"
        aria-label="Hubungi via WhatsApp"
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
              <span>Didukung oleh <span className="font-semibold text-white/80">Pengelola Gedung Pusat BMT NU Ngasem Group</span></span>
            </div>
            <p className="text-xs text-white/60">
              &copy; {new Date().getFullYear()} MITRA SEWA. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />
    </div>
  );
}
