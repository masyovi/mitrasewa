import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const rentals = await db.rental.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "No",
      "Nama Penyewa",
      "No HP",
      "Alamat",
      "Barang",
      "Jumlah",
      "Satuan",
      "Harga",
      "Tipe Sewa",
      "Multiplier",
      "Subtotal",
      "Tanggal Sewa",
      "Tanggal Kembali",
      "Lama Sewa (Hari)",
      "Total Harga",
      "Status",
    ];

    const rows: string[][] = [];
    let counter = 1;

    for (const rental of rentals) {
      for (const item of rental.items) {
        const tipeSewa = item.billingType === "bulanan" ? "Per Bulan" : "Per Hari";
        const multiplierLabel = item.billingType === "bulanan"
          ? `${item.multiplier} bulan`
          : `${item.multiplier} hari`;

        rows.push([
          String(counter++),
          rental.namaPenyewa,
          rental.noHp,
          rental.alamat,
          item.label,
          String(item.jumlah),
          "",
          formatCurrency(item.harga),
          tipeSewa,
          multiplierLabel,
          formatCurrency(item.subtotal),
          formatDate(rental.tanggalSewa),
          formatDate(rental.tanggalKembali),
          String(rental.lamaSewa),
          formatCurrency(rental.totalHarga),
          rental.status === "aktif" ? "Disewa" : "Kembali",
        ]);
      }
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const bom = "\uFEFF";
    const buffer = Buffer.from(bom + csvContent, "utf-8");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="history_penyewaan_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting CSV:", error);
    return NextResponse.json(
      { success: false, message: "Gagal export data" },
      { status: 500 }
    );
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("Rp", "Rp ");
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
