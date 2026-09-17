import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { tenant_slug: string; id: string } }
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

    const doc = await prisma.documento.findFirst({
      where: {
        id: params.id,
        tenantId: params.tenant_slug,
      },
      include: {
        assinaturas_realizadas: {
          where: { assinatura_pendente: { usuario_responsavel_id: payload.userId } },
          select: { assinatura_visual_url: true, data_hora: true },
          take: 1,
        },
      },
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      documento: {
        id: doc.id,
        nome: doc.nome,
        arquivo_url: doc.arquivo_url,
        status: doc.status,
        criado_por: doc.criado_por,
        criado_em: doc.created_at,
        assinatura_do_usuario:
          doc.assinaturas_realizadas[0] || null,
      },
    });
  } catch (error) {
    console.error("Fetch documento error:", error);
    return NextResponse.json(
      { error: "Erro ao carregar documento" },
      { status: 500 }
    );
  }
}
