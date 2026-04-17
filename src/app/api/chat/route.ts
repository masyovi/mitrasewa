import { NextRequest, NextResponse } from "next/server";

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
- Selalu perkenalkan diri sebagai Zahra dari MITRA SEWA
- Gunakan salam "Assalamualaikum" sebagai sapaan, bukan "Halo"`;

const MAX_MESSAGES = 20;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body as {
      messages: Array<{ role: string; content: string }>;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Messages are required" },
        { status: 400 }
      );
    }

    try {
      // Dynamic import z-ai-web-dev-sdk (must be in serverExternalPackages)
      const ZAI = await import("z-ai-web-dev-sdk");
      const aiInstance = ZAI.default || ZAI;
      const ai = await aiInstance.create();

      const recentMessages = messages.slice(-MAX_MESSAGES);
      const chatMessages = [
        { role: "assistant" as const, content: SYSTEM_PROMPT },
        ...recentMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      const response = await ai.chat.completions.create({
        model: "deepseek-chat",
        messages: chatMessages,
      });

      const reply = response.choices?.[0]?.message?.content;

      if (reply && reply.trim().length > 0) {
        return NextResponse.json({
          success: true,
          message: reply.trim(),
        });
      }

      return NextResponse.json(
        { success: false, error: "Empty response from AI" },
        { status: 500 }
      );
    } catch (err: any) {
      console.error("AI SDK error:", err.message || err);
      return NextResponse.json(
        {
          success: false,
          error:
            "Maaf, saya sedang mengalami gangguan teknis. Silakan coba lagi atau hubungi kami via WhatsApp di 0851-8592-4243 ya! 🙏",
        },
        { status: 500 }
      );
    }
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
