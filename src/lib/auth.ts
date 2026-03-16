import { AuthToken, Role, User } from '../types';

const JWT_KEY = 'cheboko_jwt';
const VERIFICATION_CODES: Record<string, string> = {}; // email -> code (mock)

/**
 * Simple JWT-like token encode/decode (mock for frontend demo).
 * In production, JWT is handled by the backend/Supabase.
 */
function base64Encode(obj: object): string {
  return btoa(encodeURIComponent(JSON.stringify(obj)));
}

function base64Decode(str: string): object | null {
  try {
    return JSON.parse(decodeURIComponent(atob(str)));
  } catch {
    return null;
  }
}

export function createToken(user: User): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AuthToken = {
    userId: user.id,
    role: user.role,
    iat: now,
    exp: now + 86400, // 24 hours
  };
  const header = base64Encode({ alg: 'HS256', typ: 'JWT' });
  const body = base64Encode(payload);
  const signature = base64Encode({ sig: 'mock' });
  return `${header}.${body}.${signature}`;
}

export function decodeToken(token: string): AuthToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = base64Decode(parts[1]) as AuthToken | null;
    if (!payload) return null;
    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      removeToken();
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function saveToken(token: string): void {
  localStorage.setItem(JWT_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(JWT_KEY);
}

export function removeToken(): void {
  localStorage.removeItem(JWT_KEY);
}

export function getSavedAuth(): AuthToken | null {
  const token = getToken();
  if (!token) return null;
  return decodeToken(token);
}

/** Generate a 6-digit verification code (mock) */
export function generateVerificationCode(email: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  VERIFICATION_CODES[email] = code;
  console.log(`[AUTH] Verification code for ${email}: ${code}`);
  return code;
}

/** Verify the code */
export function verifyCode(email: string, code: string): boolean {
  // In demo mode, accept any 6-digit code or the generated one
  if (code === '000000') return true; // Demo bypass
  return VERIFICATION_CODES[email] === code;
}

/** Generate invite token */
export function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/** Check if role can self-register */
export function canSelfRegister(role: Role): boolean {
  return role === 'network_manager';
}

/** Check if role requires invite */
export function requiresInvite(role: Role): boolean {
  return ['specialist', 'location_manager', 'engineer'].includes(role);
}

/** Roles that can manage invites */
export function canManageInvites(role: Role): boolean {
  return ['admin', 'region_manager'].includes(role);
}
