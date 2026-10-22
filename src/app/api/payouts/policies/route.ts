import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authed, treasurerOnly, holdsPayoutRole, isTreasurer, username, PAYOUT_ID } from "@/lib/treasury/guard";
import { checkSignedPolicy, expectedPolicy, type PolicyAccess } from "@/lib/treasury/policyCheck";

export const dynamic = "force-dynamic";

const isAccess = (a: unknown): a is PolicyAccess => a === "write" || a === "read";

// Store a policy a treasurer just had SIGNED BY THE TIDE NETWORK (enclave approval). Treasurers only
// (AP-RA08). The bytes must parse and name exactly the subject/record we expect for this payout.
// Only while the payout is DRAFT: once sealed, nobody can swap its policies.
export const POST = treasurerOnly(async (req: NextRequest, jwt) => {
  const { recordId, access, policyB64 } = await req.json();
  if (typeof recordId !== "string" || !PAYOUT_ID.test(recordId)) return Response.json({ error: "bad recordId" }, { status: 400 });
  if (!isAccess(access) || typeof policyB64 !== "string" || policyB64.length < 32) {
    return Response.json({ error: "unexpected policy shape" }, { status: 400 });
  }
  const problem = checkSignedPolicy(policyB64, recordId, access);
  if (problem) return Response.json({ error: problem }, { status: 400 });

  const want = expectedPolicy(recordId, access);
  const r = await db().query(
    `INSERT INTO policies (subject_type, subject_id, client_id, record_id, access, policy_b64, granted_by)
     SELECT 'Role', $1, $2, p.id, $3, $4, $5 FROM payouts p WHERE p.id = $6 AND p.status = 'DRAFT'
     ON CONFLICT (subject_type, subject_id, client_id, record_id)
     DO UPDATE SET policy_b64 = EXCLUDED.policy_b64, granted_by = EXCLUDED.granted_by, created_at = now()`,
    [want.subjectId, want.clientId, access, policyB64, username(jwt), recordId],
  );
  if (r.rowCount === 0) return Response.json({ error: "payout not found or no longer DRAFT" }, { status: 409 });
  return Response.json({ ok: true });
});

// Hand a policy only to a caller it applies to (AP-RA07):
//   write policy -> treasurers;  read policy -> holders of role payout-<id>.
export const GET = authed(async (req: NextRequest, jwt) => {
  const url = new URL(req.url);
  const recordId = url.searchParams.get("recordId") ?? "";
  const access = url.searchParams.get("access");
  if (!PAYOUT_ID.test(recordId)) return Response.json({ error: "bad recordId" }, { status: 400 });
  if (!isAccess(access)) return Response.json({ error: "access must be write or read" }, { status: 400 });
  if (access === "write" && !isTreasurer(jwt)) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (access === "read" && !holdsPayoutRole(jwt, recordId)) {
    return Response.json(
      { error: `You do not hold role ${recordId}. It must be granted by a quorum of treasurers.` },
      { status: 403 },
    );
  }
  const { rows } = await db().query("SELECT policy_b64 FROM policies WHERE record_id=$1 AND access=$2", [recordId, access]);
  if (!rows[0]) return Response.json({ error: "policy not signed yet" }, { status: 404 });
  return Response.json({ policyB64: rows[0].policy_b64 });
});
