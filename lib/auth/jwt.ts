import { jwtDecode } from "jwt-decode";

export interface Permissions {
  canCreateTicket: boolean;
  canEndorseTicket: boolean;
  canApproveTicket: boolean;
  canResolveTicket: boolean;
  canAudit: boolean;
}

export interface JwtClaims {
  id: number;
  staff_id?: string;
  username?: string;
  institution_id?: number;
  role_id?: number;
  role: string;
  can_create?: boolean;
  can_endorse?: boolean;
  can_approve?: boolean;
  can_resolve?: boolean;
  can_audit?: boolean;
  exp: number;
  iat: number;
}

export function decodeToken(token: string): JwtClaims | null {
  try {
    const decoded = jwtDecode<JwtClaims>(token);
    if (decoded.exp * 1000 < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function extractPermissions(claims: JwtClaims): Permissions {
  return {
    canCreateTicket: !!claims.can_create,
    canEndorseTicket: !!claims.can_endorse,
    canApproveTicket: !!claims.can_approve,
    canResolveTicket: !!claims.can_resolve,
    canAudit: !!claims.can_audit,
  };
}