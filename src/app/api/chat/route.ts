import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

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

const MAX_MESSAGES = 20;

async function getAI(): Promise<ZAI> {
  return ZAI.create();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, sessionId } = body as {
      messages: Array<{ role: string; content: string }>;
      sessionId?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    // Build messages array with system prompt + last N messages
    const recentMessages = messages.slice(-MAX_MESSAGES);
    const chatMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
      ...recentMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    let lastError: Error | null = null;

    // Retry logic (up to 2 retries)
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const ai = await getAI();
        const response = await ai.chat.completions.create({
          messages: chatMessages,
        });

        const assistantMessage =
          response?.choices?.[0]?.message?.content ||
          response?.content ||
          "Maaf, saya sedang mengalami gangguan. Silakan coba lagi atau hubungi kami via WhatsApp di 0851-8592-4243.";

        return NextResponse.json({
          success: true,
          message: assistantMessage,
          sessionId: sessionId || `session_${Date.now()}`,
        });
      } catch (err) {
        lastError = err as Error;
        console.error(`Chat API attempt ${attempt + 1} failed:`, err);
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Gagal mendapatkan respons. Silakan coba lagi.",
        details: lastError?.message,
      },
      { status: 500 }
    );
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal. Silakan coba lagi.",
      },
      { status: 500 }
    );
  }
}
