import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminJWT } from "@/lib/auth";
import { uploadToS3 } from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    const superToken = req.cookies.get("selo_super_token")?.value;
    if (!superToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = verifySuperAdminJWT(superToken);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const logo = formData.get("logo") as File | null;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Nome e slug são obrigatórios" },
        { status: 400 }
      );
    }

    // Verify slug is unique
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: "Slug já existe" },
        { status: 400 }
      );
    }

    // Upload logo to S3 if provided
    let logoUrl = null;
    if (logo) {
      const s3Key = `logos/${slug}/${Date.now()}-${logo.name}`;
      logoUrl = await uploadToS3(logo, s3Key);
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        logo_url: logoUrl,
      },
    });

    return NextResponse.json(
      {
        success: true,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          logo_url: tenant.logo_url,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create tenant error:", error);
    return NextResponse.json(
      { error: "Erro ao criar tenant" },
      { status: 500 }
    );
  }
}
