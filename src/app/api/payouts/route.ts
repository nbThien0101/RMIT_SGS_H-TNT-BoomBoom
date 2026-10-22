import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { db } from '@/lib/db';
import { authed, treasurerOnly, username } from '@/lib/treasury/guard';

export const dynamic = 'force-dynamic';

// List payouts (public metadata only — never plaintext; there is none on this server).
export const GET = authed(async () => {
  const { rows } = await db().query(
    `SELECT p.id, p.title, p.amount_public, p.status, p.requested_by, p.released_by,
            p.created_at, p.released_at, (p.sealed IS NOT NULL) AS has_sealed,
            COALESCE(json_agg(json_build_object('subject', pol.subject_id, 'access', pol.access))
                     FILTER (WHERE pol.record_id IS NOT NULL), '[]') AS policies
       FROM payouts p LEFT JOIN policies pol ON pol.record_id = p.id
      GROUP BY p.id ORDER BY p.created_at DESC`,
  );
  const { rows: transfers } = await db().query(
    'SELECT * FROM bank_transfers ORDER BY created_at DESC LIMIT 20',
  );
  return Response.json({ payouts: rows, transfers });
});

// Create a payout request (treasurers only). The sensitive part is sealed later, in the browser.
export const POST = treasurerOnly(async (req: NextRequest, jwt) => {
  const { title, amount } = await req.json();
  const amt = Number(amount);
  // VND has no minor unit: integers only, so the sealed amount and the public column compare exactly.
  if (!title || typeof title !== 'string' || title.length > 120 || !Number.isSafeInteger(amt) || amt <= 0) {
    return Response.json({ error: 'title and positive whole-VND amount required' }, { status: 400 });
  }
  const id = `payout-${randomBytes(4).toString('hex')}`;
  await db().query(
    'INSERT INTO payouts (id, title, amount_public, requested_by) VALUES ($1,$2,$3,$4)',
    [id, title, amt, username(jwt)],
  );
  return Response.json({ id });
});
