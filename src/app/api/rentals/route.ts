import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RentalItemInput {
  item: string;
  label: string;
  jumlah: number;
  harga: number;
  billingType: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const overdueOnly = searchParams.get("overdue") === "true";

    const rentals = await db.rental.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enriched = rentals.map((rental) => {
      const kembali = new Date(rental.tanggalKembali);
      kembali.setHours(0, 0, 0, 0);

      const isOverdue = rental.status === "aktif" && kembali < today;
      const diffTime = today.getTime() - kembali.getTime();
      const daysOverdue = isOverdue
        ? Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        : 0;

      return {
        ...rental,
        isOverdue,
        daysOverdue: isOverdue ? daysOverdue : 0,
      };
    });

    const data = overdueOnly
      ? enriched.filter((r) => r.isOverdue)
      : enriched;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching rentals:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data penyewaan" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      namaPenyewa,
      nik,
      noHp,
      alamat,
      tanggalSewa,
      tanggalKembali,
      items,
    } = body as {
      namaPenyewa: string;
      nik?: string;
      noHp: string;
      alamat: string;
      tanggalSewa: string;
      tanggalKembali: string;
      items: RentalItemInput[];
    };

    const sewaDate = new Date(tanggalSewa);
    const kembaliDate = new Date(tanggalKembali);
    const diffTime = kembaliDate.getTime() - sewaDate.getTime();
    const lamaSewa = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    if (kembaliDate < sewaDate) {
      return NextResponse.json(
        { success: false, message: "Tanggal kembali harus >= tanggal sewa" },
        { status: 400 }
      );
    }

    if (lamaSewa < 1) {
      return NextResponse.json(
        { success: false, message: "Lama sewa minimal 1 hari" },
        { status: 400 }
      );
    }

    const stockSettings = await db.stockSetting.findMany();
    const stockMap: Record<string, number> = {};
    for (const s of stockSettings) {
      stockMap[s.item] = s.total;
    }

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

    for (const item of items) {
      const total = stockMap[item.item] || 0;
      const rented = rentedMap[item.item] || 0;
      const available = total - rented;

      if (item.jumlah <= 0) {
        return NextResponse.json(
          { success: false, message: `Jumlah ${item.label} harus lebih dari 0` },
          { status: 400 }
        );
      }

      if (item.jumlah > available) {
        return NextResponse.json(
          { success: false, message: `Stok ${item.label} tidak mencukupi. Tersedia: ${available}` },
          { status: 400 }
        );
      }
    }

    let totalHarga = 0;
    const rentalItems = items.map((item) => {
      let multiplier = lamaSewa;
      if (item.billingType === "bulanan") {
        multiplier = Math.max(1, Math.ceil(lamaSewa / 30));
      }
      const subtotal = item.jumlah * item.harga * multiplier;
      totalHarga += subtotal;
      return {
        item: item.item,
        label: item.label,
        jumlah: item.jumlah,
        harga: item.harga,
        billingType: item.billingType,
        multiplier,
        subtotal,
      };
    });

    const rental = await db.rental.create({
      data: {
        namaPenyewa,
        nik: nik || "",
        noHp,
        alamat,
        tanggalSewa: sewaDate,
        tanggalKembali: kembaliDate,
        lamaSewa,
        status: "aktif",
        totalHarga,
        items: {
          create: rentalItems,
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, data: rental });
  } catch (error) {
    console.error("Error creating rental:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan data penyewaan" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body as { id: string; status: string };

    if (status !== "kembali" && status !== "aktif") {
      return NextResponse.json(
        { success: false, message: "Status tidak valid" },
        { status: 400 }
      );
    }

    const rental = await db.rental.update({
      where: { id },
      data: { status },
      include: { items: true },
    });

    return NextResponse.json({ success: true, data: rental });
  } catch (error) {
    console.error("Error updating rental:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengupdate status" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID diperlukan" },
        { status: 400 }
      );
    }

    await db.rental.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Data berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting rental:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus data" },
      { status: 500 }
    );
  }
}
