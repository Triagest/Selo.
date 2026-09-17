// Tipos globais para Selo

export interface JWTPayload {
  userId: string;
  tenantId: string;
  username: string;
  isMaster: boolean;
  iat: number;
  exp: number;
}

export interface SuperAdminJWTPayload {
  email: string;
  isSuperAdmin: true;
  iat: number;
  exp: number;
}

export interface Session {
  user: {
    id: string;
    tenantId: string;
    username: string;
    nome: string;
    email: string;
    isMaster: boolean;
    assinaturaUrl: string | null;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
}

export interface SuperAdminSession {
  user: {
    email: string;
    nome: string;
  };
}

export const PERMISSIONS = {
  GERENCIAR_USUARIOS: "gerenciar_usuarios",
  FAZER_UPLOAD_DOCUMENTOS: "fazer_upload_documentos",
  MARCAR_ASSINANTES: "marcar_assinantes",
  ASSINAR_DOCUMENTOS: "assinar_documentos",
  VISUALIZAR_AUDITORIA: "visualizar_auditoria",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
