import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, additionalDays, notes } = body as { id: string; additionalDays: number; notes?: string };

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID penyewaan diperlukan" },
        { status: 400 }
      );
    }

    if (!additionalDays || additionalDays < 1 || !Number.isInteger(additionalDays)) {
      return NextResponse.json(
        { success: false, message: "Jumlah hari perpanjangan minimal 1 hari" },
        { status: 400 }
      );
    }

    if (additionalDays > 365) {
      return NextResponse.json(
        { success: false, message: "Perpanjangan maksimal 365 hari" },
        { status: 400 }
      );
    }

    // Find rental with items and extensions
    const rental = await db.rental.findUnique({
      where: { id },
      include: { items: true, extensions: true },
    });

    if (!rental) {
      return NextResponse.json(
        { success: false, message: "Data penyewaan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (rental.status !== "aktif") {
      return NextResponse.json(
        { success: false, message: "Penyewaan sudah dikembalikan, tidak dapat diperpanjang" },
        { status: 400 }
      );
    }

    // Calculate new tanggalKembali starting from today + additionalDays
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newTanggalKembali = new Date(today);
    newTanggalKembali.setDate(newTanggalKembali.getDate() + additionalDays);

    const previousTanggalKembali = new Date(rental.tanggalKembali);

    // Calculate extension total: cost only for the additional days
    // The extension days run from today to newTanggalKembali
    let extensionTotal = 0;
    for (const item of rental.items) {
      let multiplier = additionalDays;
      if (item.billingType === "bulanan") {
        multiplier = Math.max(1, Math.ceil(additionalDays / 30));
      }
      extensionTotal += item.jumlah * item.harga * multiplier;
    }

    // Update rental and create extension record in a transaction
    const result = await db.$transaction(async (tx) => {
      // Calculate new lamaSewa from original tanggalSewa to new tanggalKembali
      const sewaDate = new Date(rental.tanggalSewa);
      sewaDate.setHours(0, 0, 0, 0);
      const diffTime = newTanggalKembali.getTime() - sewaDate.getTime();
      const newLamaSewa = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      // Update rental: tanggalKembali and lamaSewa (but NOT totalHarga)
      const updated = await tx.rental.update({
        where: { id },
        data: {
          tanggalKembali: newTanggalKembali,
          lamaSewa: newLamaSewa,
        },
        include: { items: true, extensions: true },
      });

      // Create extension record (separate billing)
      const extension = await tx.rentalExtension.create({
        data: {
          rentalId: id,
          previousTanggalKembali,
          newTanggalKembali,
          extensionDays: additionalDays,
          extensionTotal,
          notes: notes || "",
        },
      });

      // Fetch final state
      return tx.rental.findUnique({
        where: { id },
        include: { items: true, extensions: { orderBy: { createdAt: "asc" } } },
      });
    });

    // Calculate grand total (original + all extensions)
    const allExtensions = result?.extensions || [];
    const totalExtensions = allExtensions.reduce((sum, ext) => sum + ext.extensionTotal, 0);
    const grandTotal = rental.totalHarga + totalExtensions;

    const todayCheck = new Date();
    todayCheck.setHours(0, 0, 0, 0);
    const newKembaliCheck = new Date(newTanggalKembali);
    newKembaliCheck.setHours(0, 0, 0, 0);
    const isStillOverdue = newKembaliCheck < todayCheck;
    const overdueDays = isStillOverdue
      ? Math.ceil((todayCheck.getTime() - newKembaliCheck.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        isOverdue: isStillOverdue,
        daysOverdue: overdueDays,
        originalTotal: rental.totalHarga,
        extensionTotal,
        grandTotal,
        extensionDays: additionalDays,
      },
    });
  } catch (error) {
    console.error("Error extending rental:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperpanjang sewa" },
      { status: 500 }
    );
  }
}
