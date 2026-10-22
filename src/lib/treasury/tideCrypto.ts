"use client";
// Thin adapter over the pack's relationship.ts (src/lib/tide/relationship.ts — do NOT edit that file).
// Browser only: every call needs the logged-in treasurer's credential, which lives in the Tide enclave.
import tcConfig from "../../../data/tidecloak.json";
import { signRelationshipPolicy, encryptForRecord, decryptForRecord, type RelationshipSubject } from "@/lib/tide/relationship";
import { parseInstruction, type PayoutInstruction } from "@/lib/treasury/instruction";
import type { SecureFetch } from "@/lib/treasury/apiFetch";

const cfg = tcConfig as { realm: string; "auth-server-url": string; vendorId?: string };
const AUTH_URL = cfg["auth-server-url"].replace(/\/+$/, "");

/**
 * The realm's admin policy (signed bytes) authorises policy signing. Fetched straight from TideCloak
 * with the treasurer's OWN DPoP-bound token: our server cannot replay that token (it has no proof key).
 */
async function fetchAdminPolicy(secureFetch: SecureFetch): Promise<Uint8Array> {
  const url = `${AUTH_URL}/admin/realms/${encodeURIComponent(cfg.realm)}/iga/role-policies/name/tide-realm-admin`;
  const r = await secureFetch(url);
  if (!r.ok) throw new Error(`could not fetch the realm admin policy (HTTP ${r.status}) — are you a tide-realm-admin?`);
  const { policy } = (await r.json()) as { policy?: string };
  if (!policy) throw new Error("realm admin policy response has no `policy` field");
  return Uint8Array.from(atob(policy), (c) => c.charCodeAt(0));
}

/**
 * Ask the Tide network to sign a RelationshipAttestation:1 policy for one payout.
 * Opens the Tide enclave approval popup — call it straight from a click. Returns base64 policy bytes.
 */
export async function signPolicy(
  secureFetch: SecureFetch,
  opts: { recordId: string; subject: RelationshipSubject; access: "read" | "write" },
): Promise<string> {
  if (!cfg.vendorId) throw new Error("data/tidecloak.json has no vendorId — re-run npm run init (IGA must be on)");
  const adminPolicy = await fetchAdminPolicy(secureFetch);
  return signRelationshipPolicy({ vendorId: cfg.vendorId, subject: opts.subject, recordId: opts.recordId, access: opts.access }, adminPolicy);
}

/** Encrypt in the browser under the WRITE policy; the record id is the ONLY tag (AP-RA03). */
export async function sealInstruction(writePolicyB64: string, instruction: PayoutInstruction): Promise<string> {
  return encryptForRecord(JSON.stringify(instruction), instruction.payoutId, writePolicyB64);
}

/** Decrypt in the browser. The ORKs release it only if this user's credential carries role payout-<id>. */
export async function openInstruction(recordId: string, readPolicyB64: string, sealed: string): Promise<PayoutInstruction> {
  const text = await decryptForRecord(sealed, recordId, readPolicyB64);
  const ins = parseInstruction(JSON.parse(text));
  if (!ins || ins.payoutId !== recordId) throw new Error("decrypted instruction is malformed or belongs to another payout");
  return ins;
}

/** A contract refusal surfaces as THRESHOLD_FAILURE: it is a "no", not an outage. Do not retry (AP-RA18). */
export function isTideRefusal(e: unknown): boolean {
  const msg = String((e as { message?: unknown })?.message ?? e);
  const cause = JSON.stringify((e as { cause?: unknown })?.cause ?? "");
  return /THRESHOLD_FAILURE/.test(msg) || /not found in doken|not found in list of roles|subjectId does not match|Tags do not contain/.test(cause);
}

export function explainTideError(e: unknown): string {
  if (isTideRefusal(e)) {
    return "Mạng Tide TỪ CHỐI: bạn chưa được quorum thủ quỹ cấp quyền cho khoản chi này (hoặc dữ liệu đã bị sửa).";
  }
  return String((e as { message?: unknown })?.message ?? e);
}
