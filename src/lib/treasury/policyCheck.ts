// Server-side: parse a signed RelationshipAttestation:1 policy and confirm it names the expected
// subject and record BEFORE storing it (AP-RA08). Mirrors describeRelationshipPolicy() in
// src/lib/tide/relationship.ts, which cannot be imported here (it pulls in the browser SDK).
// Fails closed: anything that does not parse, or does not match exactly, is rejected.
import { Models } from "@tideorg/js";
import { DECRYPT_ROLE, ENCRYPT_ROLE, RELATIONSHIP_CONTRACT_ID } from "@/lib/treasury/policyShape";

export type PolicyAccess = "write" | "read";

/** What each of our two policies per payout must say. */
export function expectedPolicy(recordId: string, access: PolicyAccess) {
  return access === "write"
    ? { subjectType: "Role", subjectId: "tide-realm-admin", clientId: "realm-management", recordId, roles: JSON.stringify([ENCRYPT_ROLE]) }
    : { subjectType: "Role", subjectId: recordId, clientId: "", recordId, roles: JSON.stringify([DECRYPT_ROLE]) };
}

export function checkSignedPolicy(policyB64: string, recordId: string, access: PolicyAccess): string | null {
  let p: InstanceType<typeof Models.Policy>;
  try {
    p = Models.Policy.from(Uint8Array.from(Buffer.from(policyB64, "base64")));
  } catch (e) {
    return `policy does not parse: ${e instanceof Error ? e.message : String(e)}`;
  }
  const param = (k: string) => String(p.params.entries.get(k) ?? "");
  if (p.contractId !== RELATIONSHIP_CONTRACT_ID) return `wrong contract ${p.contractId}`;
  if (!p.signature || p.signature.length === 0) return "policy is not signed by the network";
  const want = expectedPolicy(recordId, access);
  for (const k of ["subjectType", "subjectId", "clientId", "roles"] as const) {
    if (param(k) !== want[k]) return `policy ${k}='${param(k)}', expected '${want[k]}'`;
  }
  if (param("assignmentId") !== recordId) return `policy assignmentId='${param("assignmentId")}', expected '${recordId}'`;
  return null;
}
