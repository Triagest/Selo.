import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { JWTPayload, SuperAdminJWTPayload, Session } from "@/types";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-prod";
const JWT_EXPIRATION = "24h";

// ============================================================================
// PASSWORD HASHING
// ============================================================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================================================
// JWT TOKENS
// ============================================================================

export function signJWT(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
}

export function signSuperAdminJWT(payload: SuperAdminJWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function verifySuperAdminJWT(token: string): SuperAdminJWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SuperAdminJWTPayload;
    return decoded.isSuperAdmin ? decoded : null;
  } catch {
    return null;
  }
}

// ============================================================================
// COOKIE MANAGEMENT
// ============================================================================

export async function setAuthCookie(token: string, isSuperAdmin: boolean = false) {
  const cookieStore = await cookies();
  const cookieName = isSuperAdmin ? "selo_super_token" : "selo_token";

  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60, // 24 hours
    path: "/",
  });
}

export async function getAuthCookie(isSuperAdmin: boolean = false): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieName = isSuperAdmin ? "selo_super_token" : "selo_token";
  const cookie = cookieStore.get(cookieName);
  return cookie?.value || null;
}

export async function clearAuthCookie(isSuperAdmin: boolean = false) {
  const cookieStore = await cookies();
  const cookieName = isSuperAdmin ? "selo_super_token" : "selo_token";
  cookieStore.delete(cookieName);
}

// ============================================================================
// SESSION VALIDATION
// ============================================================================

export async function getSessionFromRequest(req: Request, isSuperAdmin: boolean = false) {
  const authHeader = req.headers.get("authorization");
  let token: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  if (!token) {
    const cookieStore = await cookies();
    const cookieName = isSuperAdmin ? "selo_super_token" : "selo_token";
    token = cookieStore.get(cookieName)?.value || null;
  }

  if (!token) {
    return null;
  }

  if (isSuperAdmin) {
    return verifySuperAdminJWT(token);
  }

  return verifyJWT(token);
}

// ============================================================================
// SESSION CONTEXT (for middleware/components)
// ============================================================================

export async function getCurrentSession(): Promise<Session | null> {
  const token = await getAuthCookie(false);
  if (!token) return null;

  const payload = verifyJWT(token);
  if (!payload) return null;

  // In a real app, you'd fetch user and tenant data from DB
  // For now, we return what's in the JWT
  return {
    user: {
      id: payload.userId,
      tenantId: payload.tenantId,
      username: payload.username,
      nome: "", // Fetched from DB in real app
      email: "", // Fetched from DB in real app
      isMaster: payload.isMaster,
      assinaturaUrl: null, // Fetched from DB in real app
    },
    tenant: {
      id: payload.tenantId,
      name: "", // Fetched from DB in real app
      slug: "", // Fetched from DB in real app
      logoUrl: null, // Fetched from DB in real app
    },
  };
}
