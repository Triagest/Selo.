import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth";
import {
  notifyNextSigner,
  notifyAllSignaturesComplete,
} from "@/lib/whatsapp";

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

    // Check permission
    const userWithPerms = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { permissions: true, assinatura_visual: true },
    });

    const hasSignPerm = userWithPerms?.permissions.some(
      (p) => p.permissionId === "assinar_documentos"
    );

    if (!hasSignPerm && !userWithPerms?.isMaster) {
      return NextResponse.json(
        { error: "Sem permissão para assinar" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { documento_id } = body;

    if (!documento_id) {
      return NextResponse.json(
        { error: "documento_id obrigatório" },
        { status: 400 }
      );
    }

    // Find pending signature for this user and document
    const assinaturaPendente = await prisma.assinatura_pendente.findFirst(
      {
        where: {
          documento_id,
          usuario_responsavel_id: payload.userId,
          assinado_em: null,
        },
        include: { documento: true },
      }
    );

    if (!assinaturaPendente) {
      return NextResponse.json(
        { error: "Nenhuma assinatura pendente para este documento" },
        { status: 400 }
      );
    }

    const now = new Date();
    const clientIp = req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const userAgent =
      req.headers.get("user-agent") || "unknown";

    // TODO: Get user's signature image and encode as base64 / URL
    // For now, placeholder
    const assinatura_visual_url =
      userWithPerms?.assinatura_visual?.arquivo_url ||
      `/placeholder/signature-${payload.userId}.png`;

    // Record signature
    await prisma.assinatura_realizada.create({
      data: {
        assinatura_pendente_id: assinaturaPendente.id,
        data_hora: now,
        ip_address: clientIp,
        user_agent: userAgent,
        assinatura_visual_url,
      },
    });

    // Mark as signed
    await prisma.assinatura_pendente.update({
      where: { id: assinaturaPendente.id },
      data: { assinado_em: now },
    });

    // Log to audit
    await prisma.audit_log.create({
      data: {
        tenantId: params.tenant_slug,
        usuario_id: payload.userId,
        acao: "ASSINOU_DOCUMENTO",
        recurso_id: documento_id,
        detalhes: JSON.stringify({ ip: clientIp }),
      },
    });

    // Check if all signatures complete
    const pendingCount = await prisma.assinatura_pendente.count({
      where: {
        documento_id,
        assinado_em: null,
      },
    });

    if (pendingCount === 0) {
      // All signed, update document status
      await prisma.documento.update({
        where: { id: documento_id },
        data: { status: "COMPLETO" },
      });

      // Notify document creator that all signatures are complete
      const docCreator = await prisma.user.findUnique({
        where: { id: assinaturaPendente.documento.criado_por },
        select: { nome: true },
      });
      // TODO: Get creator phone_number from user profile
      // await notifyAllSignaturesComplete(docCreator.phone_number, assinaturaPendente.documento.nome, params.tenant_slug, documento_id);
    } else {
      // Update to EM_ASSINATURA
      await prisma.documento.update({
        where: { id: documento_id },
        data: { status: "EM_ASSINATURA" },
      });

      // Notify next signer
      const nextSigner = await prisma.assinatura_pendente.findFirst({
        where: { documento_id, assinado_em: null },
        orderBy: { ordem_sequencia: "asc" },
        include: { usuario_responsavel: { select: { nome: true } } },
      });

      if (nextSigner) {
        // TODO: Get nextSigner phone_number from user profile
        // await notifyNextSigner(
        //   nextSigner.usuario_responsavel.phone_number,
        //   assinaturaPendente.documento.nome,
        //   params.tenant_slug,
        //   documento_id,
        //   nextSigner.usuario_responsavel.nome
        // );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message:
          pendingCount === 0
            ? "Documento completamente assinado!"
            : "Assinatura registrada. Próximo assinante será notificado.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create assinatura error:", error);
    return NextResponse.json(
      { error: "Erro ao registrar assinatura" },
      { status: 500 }
    );
  }
}
