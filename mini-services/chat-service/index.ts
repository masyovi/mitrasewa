import { serve } from "bun";
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

const PORT = 3031;

// Pre-create ZAI instance for reuse
let aiInstance: any = null;
async function getAI() {
  if (!aiInstance) {
    aiInstance = await ZAI.create();
    console.log("ZAI instance created");
  }
  return aiInstance;
}

const server = serve({
  port: PORT,
  async fetch(req) {
    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return Response.json(
        { success: false, error: "Method not allowed" },
        { status: 405, headers: corsHeaders }
      );
    }

    try {
      const body = await req.json();
      const { messages } = body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return Response.json(
          { success: false, error: "Messages are required" },
          { status: 400, headers: corsHeaders }
        );
      }

      const recentMessages = messages.slice(-MAX_MESSAGES);
      const chatMessages = [
        { role: "assistant" as const, content: SYSTEM_PROMPT },
        ...recentMessages.map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      const ai = await getAI();
      const response = await ai.chat.completions.create({
        messages: chatMessages,
        thinking: { type: "disabled" },
      });

      const reply = response.choices?.[0]?.message?.content;

      if (reply && reply.trim().length > 0) {
        return Response.json(
          { success: true, message: reply.trim() },
          { status: 200, headers: corsHeaders }
        );
      }

      return Response.json(
        { success: false, error: "Empty response from AI" },
        { status: 500, headers: corsHeaders }
      );
    } catch (err: any) {
      console.error("Chat service error:", err.message || err);
      return Response.json(
        { success: false, error: "AI service unavailable" },
        { status: 500, headers: corsHeaders }
      );
    }
  },
});

console.log(`Chat service running on port ${PORT}`);
