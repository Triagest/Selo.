import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, signJWT } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  tenantSlug: z.string(),
  username: z.string(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantSlug, username, password } = loginSchema.parse(body);

    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant não encontrado" },
        { status: 404 }
      );
    }

    // Find user in tenant
    const user = await prisma.user.findUnique({
      where: {
        tenantId_username: {
          tenantId: tenant.id,
          username,
        },
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário ou senha inválidos" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Usuário ou senha inválidos" },
        { status: 401 }
      );
    }

    // Create JWT
    const permissionNames = user.permissions.map((up) => up.permission.name);
    const token = signJWT({
      userId: user.id,
      tenantId: tenant.id,
      username: user.username,
      isMaster: user.isMaster,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24h
    });

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        nome: user.nome,
        email: user.email,
        isMaster: user.isMaster,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      permissions: permissionNames,
    });

    response.cookies.set("selo_token", token, {
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

    console.error("Tenant login error:", error);
    return NextResponse.json(
      { error: "Erro ao fazer login" },
      { status: 500 }
    );
  }
}
