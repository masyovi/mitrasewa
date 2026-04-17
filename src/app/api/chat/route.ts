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

// ====== Groq API (for Vercel / production) — fast & free ======
async function chatWithGroq(
  chatMessages: Array<{ role: string; content: string }>
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: chatMessages,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error: ${res.status} - ${err}`);
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content;
  if (!reply) throw new Error("Empty response from Groq");
  return reply.trim();
}

// ====== z-ai-web-dev-sdk (for local sandbox only) ======
async function chatWithZAI(
  chatMessages: Array<{ role: string; content: string }>
): Promise<string> {
  const ZAI = await import("z-ai-web-dev-sdk");
  const aiInstance = ZAI.default || ZAI;
  const ai = await aiInstance.create();

  const response = await ai.chat.completions.create({
    model: "deepseek-chat",
    messages: chatMessages,
  });

  const reply = response.choices?.[0]?.message?.content;
  if (!reply) throw new Error("Empty response from z-ai-web-dev-sdk");
  return reply.trim();
}

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

    const recentMessages = messages.slice(-MAX_MESSAGES);
    const chatMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...recentMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    let reply: string;

    // Strategy: try z-ai-web-dev-sdk first (free, local), then fallback to Groq (Vercel)
    // 1. Try z-ai-web-dev-sdk (local sandbox)
    try {
      reply = await chatWithZAI(chatMessages);
      return NextResponse.json({ success: true, message: reply });
    } catch (e: any) {
      console.warn("z-ai-web-dev-sdk failed, trying Groq:", e.message);
    }

    // 2. Fallback to Groq API (Vercel / production)
    try {
      reply = await chatWithGroq(chatMessages);
      return NextResponse.json({ success: true, message: reply });
    } catch (e: any) {
      console.error("Groq API failed:", e.message);
    }

    // Both failed
    return NextResponse.json(
      {
        success: false,
        error:
          "Maaf, saya sedang mengalami gangguan teknis. Silakan coba lagi atau hubungi kami via WhatsApp di 0851-8592-4243 ya! 🙏",
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
