import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, signSuperAdminJWT, setAuthCookie } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    // Find super-admin
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email },
    });

    if (!superAdmin) {
      return NextResponse.json(
        { error: "Email ou senha inválidos" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, superAdmin.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Email ou senha inválidos" },
        { status: 401 }
      );
    }

    // Create JWT
    const token = signSuperAdminJWT({
      email: superAdmin.email,
      isSuperAdmin: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24h
    });

    // Set cookie
    const response = NextResponse.json({
      success: true,
      email: superAdmin.email,
      nome: superAdmin.nome,
    });

    response.cookies.set("selo_super_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Super-admin login error:", error);
    return NextResponse.json(
      { error: "Erro ao fazer login" },
      { status: 500 }
    );
  }
}
