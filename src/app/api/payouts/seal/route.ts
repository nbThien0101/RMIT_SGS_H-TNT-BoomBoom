import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { treasurerOnly, authed, username, PAYOUT_ID } from "@/lib/treasury/guard";
import { COMMITMENT } from "@/lib/treasury/instruction";

export const dynamic = "force-dynamic";

// Store the ciphertext (and its commitment) produced in the treasurer's browser. Plaintext never
// reaches this server. Sealing happens ONCE: only a DRAFT payout whose two signed policies are stored.
// A sealed instruction can never be replaced, so the quorum's later grant cannot be redirected.
export const POST = treasurerOnly(async (req: NextRequest, jwt) => {
  const { recordId, sealed, commitment } = await req.json();
  if (typeof recordId !== "string" || !PAYOUT_ID.test(recordId) || typeof sealed !== "string" || sealed.length < 16) {
    return Response.json({ error: "bad input" }, { status: 400 });
  }
  if (typeof commitment !== "string" || !COMMITMENT.test(commitment)) {
    return Response.json({ error: "bad commitment" }, { status: 400 });
  }
  const r = await db().query(
    `UPDATE payouts SET sealed = $2, commitment = $3, sealed_by = $4, status = 'SEALED'
      WHERE id = $1 AND status = 'DRAFT'
        AND EXISTS (SELECT 1 FROM policies WHERE record_id = $1 AND access = 'write')
        AND EXISTS (SELECT 1 FROM policies WHERE record_id = $1 AND access = 'read')`,
    [recordId, sealed, commitment, username(jwt)],
  );
  if (r.rowCount === 0) {
    return Response.json({ error: "not found, already sealed, or policies not signed yet" }, { status: 409 });
  }
  return Response.json({ ok: true });
});

// Fetch ciphertext for a payout (any logged-in user — it is useless without the quorum-granted role).
export const GET = authed(async (req: NextRequest) => {
  const id = new URL(req.url).searchParams.get("recordId") ?? "";
  if (!PAYOUT_ID.test(id)) return Response.json({ error: "bad recordId" }, { status: 400 });
  const { rows } = await db().query("SELECT sealed, status FROM payouts WHERE id=$1", [id]);
  if (!rows[0]?.sealed) return Response.json({ error: "not sealed" }, { status: 404 });
  return Response.json(rows[0]);
});
