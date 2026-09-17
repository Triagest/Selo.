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

    const documentos = await prisma.documento.findMany({
      where: { tenantId: params.tenant_slug },
      select: {
        id: true,
        nome: true,
        status: true,
        criado_em: true,
        assinaturas_pendentes: {
          select: { id: true, assinado_em: true },
        },
      },
      orderBy: { criado_em: "desc" },
    });

    const formatted = documentos.map((doc) => ({
      id: doc.id,
      nome: doc.nome,
      status: doc.status,
      criado_em: doc.criado_em,
      assinantesCount: doc.assinaturas_pendentes.length,
      assinacoesConcluidas: doc.assinaturas_pendentes.filter(
        (a) => a.assinado_em
      ).length,
    }));

    return NextResponse.json({ documentos: formatted });
  } catch (error) {
    console.error("Fetch documentos error:", error);
    return NextResponse.json(
      { error: "Erro ao carregar documentos" },
      { status: 500 }
    );
  }
}
