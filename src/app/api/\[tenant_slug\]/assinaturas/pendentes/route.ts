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

    const pendentes = await prisma.assinatura_pendente.findMany({
      where: {
        usuario_responsavel_id: payload.userId,
        assinado_em: null,
        documento: { tenantId: params.tenant_slug },
      },
      include: {
        documento: {
          select: { id: true, nome: true },
        },
      },
      orderBy: { ordem_sequencia: "asc" },
    });

    return NextResponse.json({ pendentes });
  } catch (error) {
    console.error("Fetch pendentes error:", error);
    return NextResponse.json(
      { error: "Erro ao carregar assinaturas pendentes" },
      { status: 500 }
    );
  }
}
