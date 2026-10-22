#!/usr/bin/env bash
# Demo: play the "rogue server admin" who owns the database.
#   ./scripts/rogue-admin.sh show            -> what the DB owner can see (ciphertext only)
#   ./scripts/rogue-admin.sh tamper <id>     -> swap bytes in the sealed instruction
#   ./scripts/rogue-admin.sh inflate <id>    -> raise the public amount column (bank ignores it)
#   ./scripts/rogue-admin.sh force <id>      -> mark RELEASED directly (no money moves: no bank record)
set -euo pipefail
PSQL=(docker exec -i quynhom-db psql -U quynhom -d quynhom -v ON_ERROR_STOP=1)
case "${1:-show}" in
  show)
    "${PSQL[@]}" -c "SELECT id, title, amount_public, status, left(sealed, 60) || '…' AS sealed, left(commitment, 16) || '…' AS commitment FROM payouts ORDER BY created_at DESC;"
    "${PSQL[@]}" -c "SELECT subject_id, client_id, record_id, access, left(policy_b64, 40) || '…' AS policy FROM policies;" ;;
  tamper)
    "${PSQL[@]}" -c "UPDATE payouts SET sealed = translate(sealed, 'ABCDEFabcdef', 'BCDEFAbcdefa') WHERE id = '$2';"
    echo "Sealed instruction for $2 altered. Release will now fail at decryption (Tide network rejects)." ;;
  inflate)
    "${PSQL[@]}" -c "UPDATE payouts SET amount_public = amount_public * 100 WHERE id = '$2';"
    echo "Public amount inflated. The bank refuses: sealed amount no longer matches what treasurers approved." ;;
  force)
    "${PSQL[@]}" -c "UPDATE payouts SET status='RELEASED', released_by='rogue-dba' WHERE id = '$2';"
    echo "Status forged — but no bank_transfers row exists: no money moved, and the forgery is visible." ;;
  *) echo "usage: $0 show|tamper <id>|inflate <id>|force <id>"; exit 1 ;;
esac
