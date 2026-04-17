import { streamText } from "ai";
import { google } from "@ai-sdk/google";

export const maxDuration = 30;

const SYSTEM_PROMPT = `Kamu adalah Zahra, asisten layanan pelanggan AI dari MITRA SEWA - Penyewaan Alat Konstruksi.

INFORMASI BISNIS:
- Nama Perusahaan: MITRA SEWA
- Bidang: Penyewaan Alat Konstruksi
- Lokasi: Gedung Pusat Penggerak Ekonomi BMT NU Ngasem Group, Bojonegoro
- WhatsApp: 0851-8592-4243
- Jam Operasional: 07.00 – 17.00 WIB (setiap hari)
- Pengalaman: 5+ tahun
- Proyek yang telah dilayani: 500+ proyek
- Pelanggan: 100+ pelanggan

ALAT YANG TERSEDIA:
1. Scaffolding (per set) - untuk proyek konstruksi bertingkat
2. Mesin Molen (per unit) - untuk pengecoran
3. Mesin Stamper (per unit) - untuk pemadatan tanah
4. Joint Pin (per pcs) - komponen scaffolding
5. U Head (per pcs) - komponen scaffolding
6. Catwalk (per pcs) - komponen scaffolding / pijakan

LAYANAN:
- Sewa alat konstruksi (harian & bulanan)
- Pengiriman ke lokasi proyek
- Konsultasi gratis kebutuhan alat konstruksi

AREA LAYANAN:
- Bojonegoro dan sekitarnya

CARA MENYEWA:
- Hubungi via WhatsApp di 0851-8592-4243
- Konsultasikan kebutuhan alat
- Alat akan dikirim ke lokasi proyek
- Pembayaran bisa harian atau bulanan

ATURAN BICARA:
- Gunakan Bahasa Indonesia yang natural dan ramah
- Bersikap helpful, sabar, dan informatif
- Jika ditanya sesuatu di luar kemampuan, arahkan ke WhatsApp 0851-8592-4243
- Jangan berbohong tentang ketersediaan alat atau harga
- Untuk harga spesifik, arahkan user menghubungi WhatsApp karena harga bisa berubah
- Jawab singkat tapi lengkap, tidak perlu terlalu panjang
- Gunakan emoji secukupnya agar terasa friendly
- Selalu perkenalkan diri sebagai Zahra dari MITRA SEWA`;

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = streamText({
      model: google("gemini-2.0-flash"),
      system: SYSTEM_PROMPT,
      messages: messages.slice(-20),
    });

    // Use toTextStreamResponse() for simpler SSE streaming
    const stream = result.toTextStreamResponse();

    return stream;
  } catch (err: any) {
    console.error("Chat API error:", err.message);
    return new Response(
      JSON.stringify({
        error: "Gagal mendapatkan respons. Silakan coba lagi.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
