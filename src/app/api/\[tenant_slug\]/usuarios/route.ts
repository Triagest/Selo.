import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth";

export async function GET(
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

    const usuarios = await prisma.user.findMany({
      where: { tenantId: params.tenant_slug },
      select: {
        id: true,
        nome: true,
        email: true,
        username: true,
        isMaster: true,
        created_at: true,
        permissions: {
          select: {
            permissionId: true,
            permission: { select: { name: true } },
          },
        },
      },
    });

    const formatted = usuarios.map((u) => ({
      ...u,
      permissions: u.permissions.map((p) => ({
        permissionId: p.permissionId,
        name: p.permission.name,
      })),
    }));

    return NextResponse.json({ usuarios: formatted });
  } catch (error) {
    console.error("Fetch usuarios error:", error);
    return NextResponse.json(
      { error: "Erro ao carregar usuários" },
      { status: 500 }
    );
  }
}
