import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_PRICES = [
  { item: "scaffolding", label: "Frame Scaffolding", unit: "set", price: 75000, billingType: "harian" },
  { item: "shock", label: "Joint Pin (Shock)", unit: "pcs", price: 5000, billingType: "bulanan" },
  { item: "u_head", label: "U Head", unit: "pcs", price: 5000, billingType: "bulanan" },
  { item: "catwalk", label: "Catwalk", unit: "pcs", price: 5000, billingType: "bulanan" },
  { item: "mesin_stamper", label: "Mesin Stamper", unit: "unit", price: 150000, billingType: "harian" },
  { item: "mesin_molen", label: "Mesin Molen", unit: "unit", price: 100000, billingType: "harian" },
];

async function ensureDefaults() {
  for (const def of DEFAULT_PRICES) {
    const existing = await db.priceSetting.findUnique({ where: { item: def.item } });
    if (!existing) {
      await db.priceSetting.create({ data: def });
    } else if (existing.label !== def.label) {
      await db.priceSetting.update({
        where: { item: def.item },
        data: { label: def.label },
      });
    }
  }
}

export async function GET() {
  try {
    await ensureDefaults();
    const prices = await db.priceSetting.findMany({
      orderBy: { item: "asc" },
    });
    return NextResponse.json({ success: true, data: prices });
  } catch (error) {
    console.error("Error fetching prices:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data harga" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { items } = body as {
      items: { item: string; price: number; billingType?: string; label?: string; unit?: string }[];
    };

    await ensureDefaults();

    const results = [];
    for (const entry of items) {
      const updateData: Record<string, unknown> = { price: entry.price };
      if (entry.billingType !== undefined) updateData.billingType = entry.billingType;
      if (entry.label !== undefined) updateData.label = entry.label;
      if (entry.unit !== undefined) updateData.unit = entry.unit;

      const updated = await db.priceSetting.update({
        where: { item: entry.item },
        data: updateData,
      });
      results.push(updated);
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Error updating prices:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengupdate harga" },
      { status: 500 }
    );
  }
}
