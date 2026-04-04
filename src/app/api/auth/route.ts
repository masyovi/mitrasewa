import { NextRequest, NextResponse } from "next/server";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "operasional123";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      return NextResponse.json({
        success: true,
        message: "Login berhasil",
        token: Buffer.from(`${username}:${Date.now()}`).toString("base64"),
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Username atau Password salah",
      },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Request tidak valid" },
      { status: 400 }
    );
  }
}
