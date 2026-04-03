"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2 } from "lucide-react";

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutModal({ open, onOpenChange }: AboutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <div className="bg-mitra-gradient px-6 py-8 text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">MITRA SEWA</h2>
          <p className="text-sm text-white/80 mt-1">
            Penyewaan Alat Konstruksi Terpercaya
          </p>
        </div>

        <div className="p-6 space-y-5">
          <DialogHeader className="sr-only">
            <DialogTitle>Tentang MITRA SEWA</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-600 leading-relaxed">
            MITRA SEWA adalah aplikasi manajemen penyewaan alat konstruksi 
            yang dirancang untuk memudahkan pengelolaan stok, peminjaman, 
            dan pencatatan transaksi sewa alat-alat konstruksi.
          </p>

          <div className="text-center space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
              Didukung oleh
            </p>
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-4 py-2.5 rounded-xl">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold">
                Pengelola Gedung Pusat BMT NU Ngasem Group
              </span>
            </div>
          </div>

          <p className="text-center text-[10px] text-gray-400">
            &copy; {new Date().getFullYear()} MITRA SEWA. All rights reserved.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
