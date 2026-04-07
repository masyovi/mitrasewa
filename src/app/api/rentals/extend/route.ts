import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST: Create new extension
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, newTanggalKembali, notes } = body as {
      id: string;
      newTanggalKembali: string;
      notes?: string;
    };

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID penyewaan diperlukan" },
        { status: 400 }
      );
    }

    if (!newTanggalKembali) {
      return NextResponse.json(
        { success: false, message: "Tanggal pengembalian baru diperlukan" },
        { status: 400 }
      );
    }

    // Parse the new date
    const parsedDate = new Date(newTanggalKembali);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { success: false, message: "Format tanggal tidak valid" },
        { status: 400 }
      );
    }
    parsedDate.setHours(0, 0, 0, 0);

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

    // Use the latest tanggalKembali (from the rental record, which already reflects previous extensions)
    const currentKembali = new Date(rental.tanggalKembali);
    currentKembali.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // New date must be after current tanggalKembali
    if (parsedDate <= currentKembali) {
      return NextResponse.json(
        { success: false, message: "Tanggal baru harus lebih dari tanggal jatuh tempo saat ini (" + currentKembali.toLocaleDateString("id-ID") + ")" },
        { status: 400 }
      );
    }

    // Calculate extension days: from day AFTER current tanggalKembali to new date
    const startDate = new Date(currentKembali);
    startDate.setDate(startDate.getDate() + 1);
    const diffTime = parsedDate.getTime() - startDate.getTime();
    const additionalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    if (additionalDays > 3650) {
      return NextResponse.json(
        { success: false, message: "Perpanjangan maksimal 10 tahun" },
        { status: 400 }
      );
    }

    const previousTanggalKembali = new Date(rental.tanggalKembali);

    // Calculate extension total: cost for the additional days
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
      const diffTimeLama = parsedDate.getTime() - sewaDate.getTime();
      const newLamaSewa = Math.max(1, Math.ceil(diffTimeLama / (1000 * 60 * 60 * 24)) + 1);

      // Update rental: tanggalKembali and lamaSewa (but NOT totalHarga)
      await tx.rental.update({
        where: { id },
        data: {
          tanggalKembali: parsedDate,
          lamaSewa: newLamaSewa,
        },
      });

      // Create extension record
      await tx.rentalExtension.create({
        data: {
          rentalId: id,
          previousTanggalKembali,
          newTanggalKembali: parsedDate,
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

    // Calculate grand total
    const allExtensions = result?.extensions || [];
    const totalExtensions = allExtensions.reduce((sum, ext) => sum + ext.extensionTotal, 0);
    const grandTotal = rental.totalHarga + totalExtensions;

    const todayCheck = new Date();
    todayCheck.setHours(0, 0, 0, 0);
    const newKembaliCheck = new Date(parsedDate);
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

// PATCH: Edit existing extension date
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { extensionId, newTanggalKembali } = body as {
      extensionId: string;
      newTanggalKembali: string;
    };

    if (!extensionId || !newTanggalKembali) {
      return NextResponse.json(
        { success: false, message: "ID perpanjangan dan tanggal baru diperlukan" },
        { status: 400 }
      );
    }

    const parsedDate = new Date(newTanggalKembali);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { success: false, message: "Format tanggal tidak valid" },
        { status: 400 }
      );
    }
    parsedDate.setHours(0, 0, 0, 0);

    // Find extension with rental and items
    const extension = await db.rentalExtension.findUnique({
      where: { id: extensionId },
      include: {
        rental: {
          include: { items: true, extensions: { orderBy: { createdAt: "asc" } } },
        },
      },
    });

    if (!extension) {
      return NextResponse.json(
        { success: false, message: "Data perpanjangan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (extension.rental.status !== "aktif") {
      return NextResponse.json(
        { success: false, message: "Penyewaan sudah dikembalikan" },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // The new date must be after this extension's previousTanggalKembali
    const prevKembali = new Date(extension.previousTanggalKembali);
    prevKembali.setHours(0, 0, 0, 0);

    if (parsedDate <= prevKembali) {
      return NextResponse.json(
        { success: false, message: "Tanggal baru harus lebih dari tanggal sebelumnya" },
        { status: 400 }
      );
    }

    // Calculate new extension days: from day AFTER previousTanggalKembali to new date
    const startDate = new Date(prevKembali);
    startDate.setDate(startDate.getDate() + 1);
    const diffTime = parsedDate.getTime() - startDate.getTime();
    const newExtensionDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Calculate new extension total
    let newExtensionTotal = 0;
    for (const item of extension.rental.items) {
      let multiplier = newExtensionDays;
      if (item.billingType === "bulanan") {
        multiplier = Math.max(1, Math.ceil(newExtensionDays / 30));
      }
      newExtensionTotal += item.jumlah * item.harga * multiplier;
    }

    const result = await db.$transaction(async (tx) => {
      // Update the extension record
      await tx.rentalExtension.update({
        where: { id: extensionId },
        data: {
          newTanggalKembali: parsedDate,
          extensionDays: newExtensionDays,
          extensionTotal: newExtensionTotal,
        },
      });

      // Update the rental's tanggalKembali and lamaSewa to match the latest extension
      // Get all extensions ordered by date to find the latest one
      const allExts = await tx.rentalExtension.findMany({
        where: { rentalId: extension.rentalId },
        orderBy: { createdAt: "asc" },
      });

      const latestExt = allExts[allExts.length - 1];
      const rental = extension.rental;
      const sewaDate = new Date(rental.tanggalSewa);
      sewaDate.setHours(0, 0, 0, 0);
      const latestKembali = new Date(latestExt.newTanggalKembali);
      latestKembali.setHours(0, 0, 0, 0);

      const diffTimeLama = latestKembali.getTime() - sewaDate.getTime();
      const newLamaSewa = Math.max(1, Math.ceil(diffTimeLama / (1000 * 60 * 60 * 24)));

      await tx.rental.update({
        where: { id: extension.rentalId },
        data: {
          tanggalKembali: latestKembali,
          lamaSewa: newLamaSewa,
        },
      });

      // Fetch final state
      return tx.rental.findUnique({
        where: { id: extension.rentalId },
        include: { items: true, extensions: { orderBy: { createdAt: "asc" } } },
      });
    });

    const allExtensions = result?.extensions || [];
    const totalExtensions = allExtensions.reduce((sum, ext) => sum + ext.extensionTotal, 0);
    const grandTotal = extension.rental.totalHarga + totalExtensions;

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        isOverdue: false,
        daysOverdue: 0,
        originalTotal: extension.rental.totalHarga,
        extensionTotal: totalExtensions,
        grandTotal,
      },
    });
  } catch (error) {
    console.error("Error updating extension:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengubah tanggal perpanjangan" },
      { status: 500 }
    );
  }
}
