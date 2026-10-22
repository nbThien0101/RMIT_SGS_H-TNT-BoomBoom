-- Quỹ Nhóm schema. The server stores CIPHERTEXT and SIGNED POLICIES only.
-- Nothing here lets a DB owner move money: the payout instruction can only be
-- decrypted by someone holding role `payout-<id>`, and that role can only be
-- granted through a TideCloak IGA change request approved by a quorum of treasurers.

CREATE TABLE IF NOT EXISTS payouts (
  id            TEXT PRIMARY KEY,               -- e.g. "payout-7f3a2c"
  title         TEXT NOT NULL,                  -- public label ("Mua máy chiếu cho nhóm")
  amount_public NUMERIC(12,2) NOT NULL,         -- what treasurers approve; bank pays only if sealed amount equals it
  sealed        TEXT,                           -- Tide ciphertext of {payoutId, recipient, account, amount, nonce}
  commitment    TEXT,                           -- sha256 hex of the canonical instruction (bank checks it)
  sealed_by     TEXT,                           -- treasurer who sealed (username from verified JWT)
  status        TEXT NOT NULL DEFAULT 'DRAFT',  -- DRAFT | SEALED | RELEASED | REJECTED
  requested_by  TEXT NOT NULL,                  -- username from verified JWT
  released_by   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at   TIMESTAMPTZ
);

-- Signed RelationshipAttestation:1 policies, one per (subject, record).
CREATE TABLE IF NOT EXISTS policies (
  subject_type TEXT NOT NULL,      -- 'Role'
  subject_id   TEXT NOT NULL,      -- 'tide-realm-admin' + client 'realm-management' (write) or 'payout-<id>' (read)
  client_id    TEXT NOT NULL DEFAULT '',
  record_id    TEXT NOT NULL REFERENCES payouts(id) ON DELETE CASCADE,
  access       TEXT NOT NULL,      -- 'write' | 'read'
  policy_b64   TEXT NOT NULL,
  granted_by   TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (subject_type, subject_id, client_id, record_id)
);

-- Mock bank ledger: what actually "left" the fund.
CREATE TABLE IF NOT EXISTS bank_transfers (
  id          SERIAL PRIMARY KEY,
  payout_id   TEXT NOT NULL,
  recipient   TEXT NOT NULL,
  account     TEXT NOT NULL,
  amount      NUMERIC(12,2) NOT NULL,
  executed_by TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Synthetic seed data
INSERT INTO payouts (id, title, amount_public, status, requested_by) VALUES
  ('payout-demo01', 'Mua máy chiếu cho phòng sinh hoạt nhóm', 1200000, 'DRAFT', 'seed'),
  ('payout-demo02', 'Đặt cọc sân bóng cuối tuần',           850000,  'DRAFT', 'seed')
ON CONFLICT DO NOTHING;
