import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || "http://localhost:3031";

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
      // Proxy request to the AI mini-service
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 28000);

      const response = await fetch(`${CHAT_SERVICE_URL}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await response.json();

      if (data.success && data.message) {
        return NextResponse.json({
          success: true,
          message: data.message,
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: data.error || "Gagal mendapatkan respons dari AI.",
        },
        { status: 500 }
      );
    } catch (err: any) {
      console.error("Chat service proxy error:", err.message);
      return NextResponse.json(
        {
          success: false,
          error: "Maaf, saya sedang mengalami gangguan teknis. Silakan coba lagi atau hubungi kami via WhatsApp di 0851-8592-4243 ya! 🙏",
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
