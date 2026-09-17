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

    // Check permission
    const userWithPerms = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { permissions: true },
    });

    const hasAuditPerm = userWithPerms?.permissions.some(
      (p) => p.permissionId === "visualizar_auditoria"
    );

    if (!hasAuditPerm && !userWithPerms?.isMaster) {
      return NextResponse.json(
        { error: "Sem permissão para visualizar auditoria" },
        { status: 403 }
      );
    }

    const logs = await prisma.audit_log.findMany({
      where: { tenantId: params.tenant_slug },
      include: {
        usuario: {
          select: { nome: true, username: true },
        },
      },
      orderBy: { created_at: "desc" },
      take: 1000,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Fetch audit logs error:", error);
    return NextResponse.json(
      { error: "Erro ao carregar auditoria" },
      { status: 500 }
    );
  }
}
