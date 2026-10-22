// Server-side authorization for Quỹ Nhóm API routes.
// Builds on the TEMPLATE's withAuth (src/lib/auth/middleware.ts): verifies the JWT against the
// embedded JWK (iss, azp, exp) AND the DPoP proof, then calls handler(req, jwt). Any failure -> 401.
import type { NextRequest } from "next/server";
import type { JWTPayload } from "jose";
import { withAuth } from "@/lib/auth/middleware";

type Handler = (req: NextRequest, jwt: JWTPayload) => Promise<Response>;

export function username(jwt: JWTPayload): string {
  return String(jwt.preferred_username ?? jwt.sub ?? "unknown");
}

/** Treasurer = holds client role tide-realm-admin on realm-management (a CLIENT role, not realm). */
export function isTreasurer(jwt: JWTPayload): boolean {
  const ra = jwt.resource_access as Record<string, { roles?: string[] }> | undefined;
  return ra?.["realm-management"]?.roles?.includes("tide-realm-admin") ?? false;
}

/** Holds the per-payout realm role that only a quorum of treasurers can grant (IGA change request). */
export function holdsPayoutRole(jwt: JWTPayload, payoutId: string): boolean {
  const roles = (jwt.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
  return roles.includes(payoutId);
}

export function authed(handler: Handler) {
  return withAuth(handler);
}

export function treasurerOnly(handler: Handler) {
  return withAuth(async (req, jwt) => {
    if (!isTreasurer(jwt)) return Response.json({ error: "Treasurers only" }, { status: 403 });
    return handler(req, jwt);
  });
}

export const PAYOUT_ID = /^payout-[a-z0-9]{6,12}$/;
