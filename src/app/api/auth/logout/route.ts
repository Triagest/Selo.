import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Determine if super-admin or tenant user based on cookies
    const hasSuperToken = req.cookies.has("selo_super_token");

    const response = NextResponse.json({ success: true });

    // Clear appropriate cookie
    if (hasSuperToken) {
      response.cookies.delete("selo_super_token");
    } else {
      response.cookies.delete("selo_token");
    }

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Erro ao fazer logout" },
      { status: 500 }
    );
  }
}
