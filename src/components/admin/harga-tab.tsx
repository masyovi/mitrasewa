"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  Package,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  type StockData,
  type PriceData,
} from "@/lib/types";

export function HargaTab({
  priceData,
  stockData,
  onSuccess,
}: {
  priceData: PriceData[];
  stockData: StockData[];
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [billingTypes, setBillingTypes] = useState<Record<string, string>>({});
  const [stocks, setStocks] = useState<Record<string, string>>({});
  const [perbaikans, setPerbaikans] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"harga" | "stok" | "status">("harga");

  useEffect(() => {
    const p: Record<string, string> = {};
    const b: Record<string, string> = {};
    priceData.forEach((pr) => {
      p[pr.item] = String(pr.price);
      b[pr.item] = pr.billingType;
    });
    setPrices(p);
    setBillingTypes(b);

    const s: Record<string, string> = {};
    const r: Record<string, string> = {};
    stockData.forEach((st) => {
      s[st.item] = String(st.total);
      r[st.item] = String(st.perbaikan);
    });
    setStocks(s);
    setPerbaikans(r);
  }, [priceData, stockData]);

  const savePrices = async () => {
    setLoading(true);
    try {
      const items = priceData.map((p) => ({
        item: p.item,
        price: parseFloat(prices[p.item]) || 0,
        billingType: billingTypes[p.item] || "harian",
      }));
      const res = await fetch("/api/prices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Berhasil!", description: "Harga berhasil diperbarui" });
        onSuccess();
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
        description: "Gagal menyimpan harga",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveStocks = async () => {
    setLoading(true);
    try {
      const items = stockData.map((s) => ({
        item: s.item,
        total: parseInt(stocks[s.item]) || 0,
        perbaikan: parseInt(perbaikans[s.item]) || 0,
      }));
      const res = await fetch("/api/stock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Berhasil!",
          description: "Stok berhasil diperbarui",
        });
        onSuccess();
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
        description: "Gagal menyimpan stok",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Pengaturan</h2>
        <p className="text-sm text-gray-500">
          Atur harga sewa, stok alat & status alat
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === "harga" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("harga")}
          className={
            activeTab === "harga"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : ""
          }
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Setting Harga
        </Button>
        <Button
          variant={activeTab === "stok" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("stok")}
          className={
            activeTab === "stok"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : ""
          }
        >
          <Package className="w-4 h-4 mr-2" />
          Setting Stok
        </Button>
        <Button
          variant={activeTab === "status" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("status")}
          className={
            activeTab === "status"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : ""
          }
        >
          <Wrench className="w-4 h-4 mr-2" />
          Status Alat
        </Button>
      </div>

      {activeTab === "harga" && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">
              Harga Sewa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {priceData.map((price) => (
              <div
                key={price.item}
                className="flex flex-col sm:flex-row sm:items-center gap-2 p-4 rounded-lg border border-gray-100"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{price.label}</p>
                  <p className="text-xs text-gray-500">
                    per {price.unit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={billingTypes[price.item] || "harian"}
                    onChange={(e) =>
                      setBillingTypes((prev) => ({
                        ...prev,
                        [price.item]: e.target.value,
                      }))
                    }
                    className="h-9 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700"
                  >
                    <option value="harian">/ hari</option>
                    <option value="bulanan">/ bulan</option>
                  </select>
                  <span className="text-sm text-gray-500">Rp</span>
                  <Input
                    type="number"
                    value={prices[price.item] || ""}
                    onChange={(e) =>
                      setPrices((prev) => ({
                        ...prev,
                        [price.item]: e.target.value,
                      }))
                    }
                    className="w-36 h-9 text-right text-sm"
                    min={0}
                  />
                </div>
              </div>
            ))}
            <Button
              onClick={savePrices}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={loading}
            >
              {loading ? "Menyimpan..." : "Simpan Harga"}
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === "stok" && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">
              Total Stok Alat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stockData.map((stock) => (
              <div
                key={stock.item}
                className="flex flex-col sm:flex-row sm:items-center gap-2 p-4 rounded-lg border border-gray-100"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{stock.label}</p>
                    {stock.perbaikan > 0 && (
                      <Badge className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0 h-5 border-0">
                        {stock.perbaikan} perbaikan
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Tersedia: {stock.tersedia} | Disewa: {stock.disewa}
                    {stock.perbaikan > 0 && <> | Perbaikan: {stock.perbaikan}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={stocks[stock.item] || ""}
                    onChange={(e) =>
                      setStocks((prev) => ({
                        ...prev,
                        [stock.item]: e.target.value,
                      }))
                    }
                    className="w-28 h-9 text-center text-sm"
                    min={0}
                  />
                  <span className="text-sm text-gray-500">{stock.unit}</span>
                </div>
              </div>
            ))}
            <Button
              onClick={saveStocks}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={loading}
            >
              {loading ? "Menyimpan..." : "Simpan Stok"}
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === "status" && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Wrench className="w-4 h-4 text-orange-500" />
              Status Alat - Perbaikan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
              Atur jumlah unit yang sedang dalam perbaikan. Unit dalam status perbaikan tidak akan tersedia untuk disewa.
            </p>
            {stockData.map((stock) => {
              const perbaikanVal = parseInt(perbaikans[stock.item]) || 0;
              const statusLabel = perbaikanVal > 0 ? "Perbaikan" : "Ready";
              const statusColor = perbaikanVal > 0
                ? "bg-orange-100 text-orange-700 border-orange-200"
                : "bg-emerald-100 text-emerald-700 border-emerald-200";

              return (
                <div
                  key={stock.item}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border border-gray-100 bg-white"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-gray-900">
                        {stock.label}
                      </p>
                      <Badge className={`text-[10px] px-2 py-0 h-5 border ${statusColor}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${perbaikanVal > 0 ? "bg-orange-500" : "bg-emerald-500"}`} />
                        {statusLabel}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <span className="text-xs text-gray-500">
                        Total: <span className="font-semibold text-gray-700">{stock.total}</span> {stock.unit}
                      </span>
                      <span className="text-xs text-emerald-600">
                        Tersedia: <span className="font-semibold">{stock.tersedia}</span>
                      </span>
                      <span className="text-xs text-amber-600">
                        Disewa: <span className="font-semibold">{stock.disewa}</span>
                      </span>
                      {perbaikanVal > 0 && (
                        <span className="text-xs text-orange-600">
                          Perbaikan: <span className="font-semibold">{perbaikanVal}</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                      {stock.disewa > 0 && (
                        <div
                          className="h-full bg-amber-400"
                          style={{ width: `${stock.total > 0 ? (stock.disewa / stock.total) * 100 : 0}%` }}
                        />
                      )}
                      {perbaikanVal > 0 && (
                        <div
                          className="h-full bg-orange-400"
                          style={{ width: `${stock.total > 0 ? (perbaikanVal / stock.total) * 100 : 0}%` }}
                        />
                      )}
                    </div>
                    <div className="flex gap-3 mt-1">
                      {stock.disewa > 0 && <span className="text-[10px] text-amber-500">■ Disewa</span>}
                      {perbaikanVal > 0 && <span className="text-[10px] text-orange-500">■ Perbaikan</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-center">
                      <Label className="text-[10px] text-gray-500 block mb-1">Jml Perbaikan</Label>
                      <Input
                        type="number"
                        value={perbaikans[stock.item] || "0"}
                        onChange={(e) =>
                          setPerbaikans((prev) => ({
                            ...prev,
                            [stock.item]: e.target.value,
                          }))
                        }
                        className="w-20 h-9 text-center text-sm"
                        min={0}
                        max={stock.total}
                      />
                    </div>
                    <span className="text-xs text-gray-400 mt-4">{stock.unit}</span>
                  </div>
                </div>
              );
            })}
            <Button
              onClick={saveStocks}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={loading}
            >
              {loading ? "Menyimpan..." : "Simpan Status Alat"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
