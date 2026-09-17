import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth";
import { uploadToS3 } from "@/lib/s3";
import { notifyFirstSigner } from "@/lib/whatsapp";

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

    // Check if user has permission to manage documents
    const userWithPerms = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { permissions: true },
    });

    const hasDocPerm = userWithPerms?.permissions.some(
      (p) => p.permissionId === "gerenciar_documentos"
    );

    if (!hasDocPerm && !userWithPerms?.isMaster) {
      return NextResponse.json(
        { error: "Sem permissão para gerenciar documentos" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const nome = formData.get("nome") as string;
    const arquivo = formData.get("arquivo") as File;
    const assinantesJson = formData.get("assinantes") as string;

    if (!nome || !arquivo) {
      return NextResponse.json(
        { error: "Nome e arquivo são obrigatórios" },
        { status: 400 }
      );
    }

    const assinantes = JSON.parse(assinantesJson || "[]") as string[];
    if (assinantes.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos um assinante" },
        { status: 400 }
      );
    }

    // Upload file to S3
    const s3Key = `documentos/${params.tenant_slug}/${Date.now()}-${arquivo.name}`;
    const arquivoUrl = await uploadToS3(arquivo, s3Key);

    // Create document
    const doc = await prisma.documento.create({
      data: {
        tenantId: params.tenant_slug,
        nome,
        arquivo_url: arquivoUrl,
        s3_key: s3Key,
        tamanho: arquivo.size,
        criado_por: payload.userId,
        status: "AGUARDANDO_ASSINATURA",
        assinaturas_pendentes: {
          create: assinantes.map((userId, idx) => ({
            usuario_responsavel_id: userId,
            ordem_sequencia: idx + 1,
          })),
        },
      },
      include: {
        assinaturas_pendentes: true,
      },
    });

    // Send WhatsApp notification to first signer
    const firstSignerId = assinantes[0];
    const firstSigner = await prisma.user.findUnique({
      where: { id: firstSignerId },
      select: { nome: true },
    });
    // TODO: Get phone number from user profile (adicionar campo phone_number no User)
    // await notifyFirstSigner(firstSigner.phone_number, doc.nome, params.tenant_slug, doc.id);

    return NextResponse.json(
      {
        success: true,
        documento: {
          id: doc.id,
          nome: doc.nome,
          status: doc.status,
          assinantes: assinantes.length,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create document error:", error);
    return NextResponse.json(
      { error: "Erro ao criar documento" },
      { status: 500 }
    );
  }
}
