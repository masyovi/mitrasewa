import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID diperlukan" },
        { status: 400 }
      );
    }

    const rental = await db.rental.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!rental) {
      return NextResponse.json(
        { success: false, message: "Data penyewaan tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: rental });
  } catch (error) {
    console.error("Error fetching receipt:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data" },
      { status: 500 }
    );
  }
}
