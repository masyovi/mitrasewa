import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_STOCK = [
  { item: "scaffolding", label: "Frame Scaffolding", unit: "set", total: 100 },
  { item: "shock", label: "Joint Pin (Shock)", unit: "pcs", total: 200 },
  { item: "u_head", label: "U Head", unit: "pcs", total: 200 },
  { item: "catwalk", label: "Catwalk", unit: "pcs", total: 200 },
  { item: "mesin_stamper", label: "Mesin Stamper", unit: "unit", total: 5 },
  { item: "mesin_molen", label: "Mesin Molen", unit: "unit", total: 5 },
];

async function ensureDefaults() {
  for (const def of DEFAULT_STOCK) {
    const existing = await db.stockSetting.findUnique({ where: { item: def.item } });
    if (!existing) {
      await db.stockSetting.create({ data: def });
    } else if (existing.label !== def.label) {
      await db.stockSetting.update({
        where: { item: def.item },
        data: { label: def.label },
      });
    }
  }
}

export async function GET() {
  try {
    await ensureDefaults();

    const stockSettings = await db.stockSetting.findMany({
      orderBy: { item: "asc" },
    });

    const activeRentals = await db.rental.findMany({
      where: { status: "aktif" },
      include: { items: true },
    });

    const rentedMap: Record<string, number> = {};
    for (const rental of activeRentals) {
      for (const item of rental.items) {
        rentedMap[item.item] = (rentedMap[item.item] || 0) + item.jumlah;
      }
    }

    const stockData = stockSettings.map((s) => {
      const disewa = rentedMap[s.item] || 0;
      const perbaikan = s.perbaikan || 0;
      return {
        item: s.item,
        label: s.label,
        unit: s.unit,
        total: s.total,
        disewa,
        perbaikan,
        tersedia: Math.max(0, s.total - disewa - perbaikan),
      };
    });

    return NextResponse.json({ success: true, data: stockData });
  } catch (error) {
    console.error("Error fetching stock:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data stok" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { items } = body as {
      items: { item: string; total?: number; perbaikan?: number; label?: string; unit?: string }[];
    };

    await ensureDefaults();

    const results = [];
    for (const entry of items) {
      const updateData: Record<string, unknown> = {};
      if (entry.total !== undefined) updateData.total = entry.total;
      if (entry.perbaikan !== undefined) updateData.perbaikan = entry.perbaikan || 0;
      if (entry.label !== undefined) updateData.label = entry.label;
      if (entry.unit !== undefined) updateData.unit = entry.unit;

      const updated = await db.stockSetting.update({
        where: { item: entry.item },
        data: updateData,
      });
      results.push(updated);
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Error updating stock:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengupdate stok" },
      { status: 500 }
    );
  }
}
