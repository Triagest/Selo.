import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyJWT, hashPassword } from "@/lib/auth";
import { z } from "zod";

const createUserSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  username: z.string().min(1),
  phone_number: z.string().optional(), // "+55XXXXXXXXXX"
  permissions: z.array(z.string()),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { tenant_slug: string } }
) {
  try {
    const token = req.cookies.get("selo_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload || payload.tenantId !== params.tenant_slug) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to create users
    const userWithPerms = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { permissions: true },
    });

    const hasCreateUserPerm = userWithPerms?.permissions.some(
      (p) => p.permissionId === "criar_usuarios"
    );

    if (!hasCreateUserPerm && !userWithPerms?.isMaster) {
      return NextResponse.json(
        { error: "Sem permissão para criar usuários" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { nome, email, username, phone_number, permissions } =
      createUserSchema.parse(body);

    // Check if username exists in tenant
    const existingUser = await prisma.user.findUnique({
      where: {
        tenantId_username: {
          tenantId: params.tenant_slug,
          username,
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Usuário já existe neste tenant" },
        { status: 400 }
      );
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await hashPassword(tempPassword);

    // Create user with permissions
    const user = await prisma.user.create({
      data: {
        tenantId: params.tenant_slug,
        nome,
        email,
        username,
        phone_number,
        passwordHash,
        isMaster: false,
        permissions: {
          create: permissions.map((permId) => ({
            permissionId: permId,
          })),
        },
      },
      include: { permissions: true },
    });

    // TODO: Send email with temporary password

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          username: user.username,
          tempPassword, // In production, send via email only
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create usuario error:", error);
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}
