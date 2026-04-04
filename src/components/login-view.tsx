"use client";

import { useState } from "react";
import { useAppStore } from "@/store/use-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Eye,
  EyeOff,
  ArrowLeft,
  Lock,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LoginView() {
  const { setView, login } = useAppStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: "Login berhasil!",
          description: "Selamat datang, Admin.",
          variant: "default",
        });
        login();
      } else {
        toast({
          title: "Login gagal",
          description: data.message || "Username atau Password salah",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Terjadi kesalahan koneksi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-mitra-gradient-light hero-pattern">
      <header className="bg-mitra-gradient text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3 animate-fade-in">
          <button
            onClick={() => setView("beranda")}
            className="p-2 rounded-lg hover:bg-white/20 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            <h1 className="text-lg font-bold">MITRA SEWA</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md border-0 shadow-xl animate-scale-in card-elevated">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl p-4 w-fit animate-fade-in-up">
              <Lock className="w-8 h-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 animate-fade-in-up animate-fade-in-up-delay-1">
              Login Admin
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1 animate-fade-in-up animate-fade-in-up-delay-2">
              Masuk ke panel administrasi MITRA SEWA
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up animate-fade-in-up-delay-3">
              <div className="space-y-2 animate-fade-in-up animate-fade-in-up-delay-4">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 transition-all focus:ring-emerald-500"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2 animate-fade-in-up animate-fade-in-up-delay-5">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 transition-all focus:ring-emerald-500"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 transition-all hover:shadow-lg btn-emerald-gradient btn-press animate-fade-in-up animate-fade-in-up-delay-6"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Memproses...
                  </span>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>
            <div className="mt-4 text-center animate-fade-in-up animate-fade-in-up-delay-6">
              <button
                type="button"
                onClick={() => setView("beranda")}
                className="text-sm text-gray-400 hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5 group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Kembali ke Beranda
              </button>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-mitra-gradient text-white mt-auto no-print">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center">
          <p className="text-xs text-white/60">
            &copy; {new Date().getFullYear()} MITRA SEWA. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
