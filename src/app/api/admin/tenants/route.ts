import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminJWT } from "@/lib/auth";

export async function GET(req: NextRequest) {
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

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        logo_url: true,
        masterUserId: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error("Fetch tenants error:", error);
    return NextResponse.json(
      { error: "Erro ao carregar tenants" },
      { status: 500 }
    );
  }
}
