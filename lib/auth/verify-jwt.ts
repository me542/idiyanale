import { jwtVerify, JWTPayload } from "jose";

export interface JwtPayload extends JWTPayload {
  id: number;
  staff_id?: string;
  institution_id?: number;
  role_id?: number;
  role?: string;

  can_create?: boolean;
  can_endorse?: boolean;
  can_approve?: boolean;
  can_resolve?: boolean;
  can_audit?: boolean;

  exp: number;
  iat: number;
}

export async function verifyJWT(
  token: string
): Promise<JwtPayload | null> {
  try {
    const secret =
      process.env.NEXT_PUBLIC_JWT_SECRET;

    if (!secret) {
      throw new Error(
        "JWT secret is not configured"
      );
    }

    const secretKey =
      new TextEncoder().encode(secret);

    const { payload } = await jwtVerify(
      token,
      secretKey,
      {
        algorithms: ["HS256"],
      }
    );

    return payload as JwtPayload;
  } catch (error) {
    console.error(
      "JWT verification failed:",
      error
    );

    return null;
  }
}