import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authed, holdsPayoutRole, username, PAYOUT_ID } from "@/lib/treasury/guard";
import { commitmentOf, parseInstruction } from "@/lib/treasury/instruction";

export const dynamic = "force-dynamic";

// Mock bank. In real life this is an external bank API. It pays an instruction only when:
//  1. the caller's VERIFIED token (Tide-signed, DPoP-bound) carries role payout-<id> — a role that
//     exists only after a quorum of treasurers approved the IGA change request in their enclaves;
//  2. the instruction hashes to the commitment stored when it was sealed — so the releaser cannot
//     change recipient, account or amount after decrypting;
//  3. the sealed amount equals the public amount the treasurers saw when they approved.
export const POST = authed(async (req: NextRequest, jwt) => {
  const { payoutId, instruction } = await req.json();
  if (typeof payoutId !== "string" || !PAYOUT_ID.test(payoutId)) return Response.json({ error: "bad payoutId" }, { status: 400 });
  if (!holdsPayoutRole(jwt, payoutId)) {
    return Response.json({ error: "No quorum grant for this payout" }, { status: 403 });
  }
  const ins = parseInstruction(instruction);
  if (!ins || ins.payoutId !== payoutId) return Response.json({ error: "bad instruction" }, { status: 400 });
  const commitment = await commitmentOf(ins);

  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT status, commitment, amount_public FROM payouts WHERE id=$1 FOR UPDATE",
      [payoutId],
    );
    const p = rows[0];
    if (p?.status !== "SEALED") {
      await client.query("ROLLBACK");
      return Response.json({ error: "Payout not in SEALED state (already paid?)" }, { status: 409 });
    }
    if (p.commitment !== commitment) {
      await client.query("ROLLBACK");
      return Response.json({ error: "Instruction does not match what was sealed" }, { status: 409 });
    }
    if (Number(p.amount_public) !== ins.amount) {
      await client.query("ROLLBACK");
      return Response.json({ error: "Public amount was altered after sealing — refusing to pay" }, { status: 409 });
    }
    await client.query(
      "INSERT INTO bank_transfers (payout_id, recipient, account, amount, executed_by) VALUES ($1,$2,$3,$4,$5)",
      [payoutId, ins.recipient, ins.account, ins.amount, username(jwt)],
    );
    await client.query(
      "UPDATE payouts SET status='RELEASED', released_by=$2, released_at=now() WHERE id=$1",
      [payoutId, username(jwt)],
    );
    await client.query("COMMIT");
    return Response.json({ ok: true, paid: { recipient: ins.recipient, account: ins.account, amount: ins.amount } });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
});
