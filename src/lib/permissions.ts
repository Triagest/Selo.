import { prisma } from "./db";
import { Permission } from "@/types";

export async function hasPermission(userId: string, permission: Permission): Promise<boolean> {
  try {
    const userPerm = await prisma.userPermission.findFirst({
      where: {
        user: { id: userId },
        permission: { name: permission },
      },
    });
    return !!userPerm;
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const permissions = await prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });
    return permissions.map((up) => up.permission.name);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return [];
  }
}

export async function grantPermission(userId: string, permissionId: string): Promise<void> {
  try {
    await prisma.userPermission.create({
      data: {
        userId,
        permissionId,
      },
    });
  } catch (error) {
    console.error("Error granting permission:", error);
    throw error;
  }
}

export async function revokePermission(userId: string, permissionId: string): Promise<void> {
  try {
    await prisma.userPermission.deleteMany({
      where: {
        userId,
        permissionId,
      },
    });
  } catch (error) {
    console.error("Error revoking permission:", error);
    throw error;
  }
}

// Initialize default permissions if they don't exist
export async function ensureDefaultPermissions(): Promise<void> {
  const defaults = [
    { name: "gerenciar_usuarios", description: "Criar, editar, deletar usuários" },
    { name: "fazer_upload_documentos", description: "Fazer upload e lançar documentos" },
    { name: "marcar_assinantes", description: "Marcar quem precisa assinar (junto com upload)" },
    { name: "assinar_documentos", description: "Assinar documentos pendentes" },
    { name: "visualizar_auditoria", description: "Visualizar logs e auditoria" },
  ];

  for (const perm of defaults) {
    try {
      await prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: perm,
      });
    } catch (error) {
      console.error(`Error ensuring permission ${perm.name}:`, error);
    }
  }
}
