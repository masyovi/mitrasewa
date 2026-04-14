import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const from = fromParam ? new Date(fromParam) : sixMonthsAgo;
    const to = toParam ? new Date(toParam + "T23:59:59.999Z") : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Fetch rentals with items and extensions
    // Filter: rental tanggalSewa OR any extension createdAt falls in range
    const rentals = await db.rental.findMany({
      where: {
        OR: [
          { tanggalSewa: { gte: from, lte: to } },
          { extensions: { some: { createdAt: { gte: from, lte: to } } } },
        ],
      },
      include: { items: true, extensions: true },
      orderBy: { createdAt: "desc" },
    });

    const stockSettings = await db.stockSetting.findMany();

    // Active rentals (status = aktif)
    const activeRentals = rentals.filter((r) => r.status === "aktif");

    // Total rentals count
    const totalRentals = rentals.length;

    // Average rental duration
    const avgDuration =
      rentals.length > 0
        ? Math.round(rentals.reduce((sum, r) => sum + r.lamaSewa, 0) / rentals.length)
        : 0;

    // Monthly revenue breakdown
    const monthlyRevenue: Record<
      string,
      { month: string; revenue: number; count: number }
    > = {};

    // Generate all months in range
    const startMonth = new Date(from.getFullYear(), from.getMonth(), 1);
    const endMonth = new Date(to.getFullYear(), to.getMonth(), 1);
    const cursor = new Date(startMonth);

    while (cursor <= endMonth) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = cursor.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });
      monthlyRevenue[key] = { month: monthLabel, revenue: 0, count: 0 };
      cursor.setMonth(cursor.getMonth() + 1);
    }

    // Aggregate revenue by month
    for (const rental of rentals) {
      // Initial rental: revenue assigned to tanggalSewa month
      const sewaKey = `${rental.tanggalSewa.getFullYear()}-${String(rental.tanggalSewa.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyRevenue[sewaKey]) {
        monthlyRevenue[sewaKey].revenue += rental.totalHarga;
        monthlyRevenue[sewaKey].count += 1;
      }
      // Extensions: revenue assigned to extension createdAt month
      for (const ext of rental.extensions) {
        const extKey = `${ext.createdAt.getFullYear()}-${String(ext.createdAt.getMonth() + 1).padStart(2, "0")}`;
        if (monthlyRevenue[extKey]) {
          monthlyRevenue[extKey].revenue += ext.extensionTotal;
          monthlyRevenue[extKey].count += 1;
        }
      }
    }

    const monthlyBreakdown = Object.entries(monthlyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({ monthKey: key, ...val }));

    // Total revenue from all months in range
    const totalRevenue = monthlyBreakdown.reduce((sum, m) => sum + m.revenue, 0);

    // Top rented items
    const itemMap: Record<
      string,
      { item: string; label: string; totalJumlah: number; rentalCount: number }
    > = {};

    for (const rental of rentals) {
      for (const ri of rental.items) {
        if (!itemMap[ri.item]) {
          itemMap[ri.item] = {
            item: ri.item,
            label: ri.label,
            totalJumlah: 0,
            rentalCount: 0,
          };
        }
        itemMap[ri.item].totalJumlah += ri.jumlah;
        itemMap[ri.item].rentalCount += 1;
      }
    }

    const topItems = Object.values(itemMap)
      .sort((a, b) => b.totalJumlah - a.totalJumlah)
      .slice(0, 10);

    // Equipment utilization: currently rented / total per item
    const allActiveRentals = await db.rental.findMany({
      where: { status: "aktif" },
      include: { items: true },
    });

    const currentlyRented: Record<string, number> = {};
    for (const rental of allActiveRentals) {
      for (const ri of rental.items) {
        currentlyRented[ri.item] = (currentlyRented[ri.item] || 0) + ri.jumlah;
      }
    }

    const utilization = stockSettings.map((s) => {
      const rented = currentlyRented[s.item] || 0;
      const total = s.total;
      const rate = total > 0 ? Math.round((rented / total) * 100) : 0;
      return {
        item: s.item,
        label: s.label,
        unit: s.unit,
        total,
        disewa: rented,
        tersedia: total - rented,
        rate,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalRentals,
        activeRentals: activeRentals.length,
        avgDuration,
        monthlyBreakdown,
        topItems,
        utilization,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data analytics" },
      { status: 500 }
    );
  }
}
